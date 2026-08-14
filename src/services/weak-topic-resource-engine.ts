import type {
  Report,
  StudyResource,
  DetailedQuestionAnalysis,
} from "../types";
import { callGeminiAPI } from "./ai";

export interface WeakTopicResourceRecommendation {
  resourceId: string;
  title: string;
  type: string;
  url: string;
  relevance: "high" | "medium";
  reason: string;
}

export interface WeakTopicAnalysis {
  topic: string;
  accuracy: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  diagnosis: string;
  evidence: string[];
  recommendedResources: WeakTopicResourceRecommendation[];
}

export interface FactualTopicBreakdown {
  topic: string;
  chapter?: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  accuracy: number;
  isWeak: boolean;
  incorrectQuestions: {
    questionNumber: number;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
  }[];
}

/**
 * 1. Deterministically derives factual topic performance from question-level telemetry.
 * QUALIFYING AS WEAK TOPIC: Accuracy < 60% OR (accuracy <= 70% with at least 2 questions).
 */
export function deriveFactualTopicBreakdown(report: Report): FactualTopicBreakdown[] {
  const analysis = report.detailedAnalysis || [];
  if (analysis.length === 0) return [];

  const topicGroups = new Map<string, DetailedQuestionAnalysis[]>();

  analysis.forEach((q, idx) => {
    const rawTopic = String(q.topic || q.chapter || report.examTitle || "General").trim();
    const topicKey = rawTopic.length > 0 ? rawTopic : "General";
    if (!topicGroups.has(topicKey)) {
      topicGroups.set(topicKey, []);
    }
    topicGroups.get(topicKey)!.push({
      ...q,
      questionNumber: q.questionNumber || idx + 1,
    });
  });

  const breakdowns: FactualTopicBreakdown[] = [];

  topicGroups.forEach((questions, topic) => {
    const totalQuestions = questions.length;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const incorrectQuestions: FactualTopicBreakdown["incorrectQuestions"] = [];

    questions.forEach((q) => {
      if (q.isCorrect) {
        correctCount++;
      } else if (q.isUnanswered || !q.studentAnswer || String(q.studentAnswer).trim() === "") {
        unansweredCount++;
        incorrectQuestions.push({
          questionNumber: q.questionNumber || 1,
          questionText: q.questionText,
          studentAnswer: "― Unanswered",
          correctAnswer: String(q.correctAnswer || ""),
        });
      } else {
        wrongCount++;
        incorrectQuestions.push({
          questionNumber: q.questionNumber || 1,
          questionText: q.questionText,
          studentAnswer: String(q.studentAnswer || ""),
          correctAnswer: String(q.correctAnswer || ""),
        });
      }
    });

    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    // Deterministic weakness threshold
    const isWeak = accuracy < 60 || (totalQuestions >= 2 && accuracy <= 70 && wrongCount + unansweredCount > 0);

    breakdowns.push({
      topic,
      chapter: questions[0]?.chapter || "",
      totalQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      accuracy,
      isWeak,
      incorrectQuestions,
    });
  });

  // Sort by lowest accuracy first
  breakdowns.sort((a, b) => a.accuracy - b.accuracy);
  return breakdowns;
}

/**
 * 2. Deterministic keyword matching fallback for uploaded ZeePrep resources.
 */
export function matchResourcesLocally(
  weakTopic: FactualTopicBreakdown,
  availableResources: StudyResource[]
): WeakTopicResourceRecommendation[] {
  if (!availableResources || availableResources.length === 0) return [];

  const cleanTopicWords = weakTopic.topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["and", "the", "for", "with", "from"].includes(w));

  const scored = availableResources.map((res) => {
    let score = 0;
    const titleLower = (res.title || "").toLowerCase();
    const descLower = (res.description || "").toLowerCase();
    const subLower = (res.subject || "").toLowerCase();

    cleanTopicWords.forEach((word) => {
      if (titleLower.includes(word)) score += 5;
      if (descLower.includes(word)) score += 3;
      if (subLower.includes(word)) score += 2;
    });

    return { res, score };
  });

  const matches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // If no keyword match found, take the top available resource for the same subject
  if (matches.length === 0 && availableResources.length > 0) {
    const subjectMatches = availableResources.slice(0, 2);
    return subjectMatches.map((res) => ({
      resourceId: res.id,
      title: res.title,
      type: res.type || "pdf",
      url: res.url || "",
      relevance: "medium",
      reason: `Recommended reference material for ${weakTopic.topic}.`,
    }));
  }

  return matches.map(({ res, score }) => ({
    resourceId: res.id,
    title: res.title,
    type: res.type || "pdf",
    url: res.url || "",
    relevance: score >= 5 ? "high" : "medium",
    reason: `Targeted revision resource for ${weakTopic.topic}.`,
  }));
}

/**
 * 3. AI-Powered Resource Matcher & Diagnosis using Gemini 2.5 Flash.
 * Strictly uses ACTUAL uploaded ZeePrep resources (never fabricates URLs or imaginary content).
 */
export async function matchWeakTopicsWithZeePrepResources(
  report: Report,
  availableResources: StudyResource[]
): Promise<WeakTopicAnalysis[]> {
  const topicBreakdowns = deriveFactualTopicBreakdown(report);
  const weakTopics = topicBreakdowns.filter((t) => t.isWeak);

  // If student performed well across all topics
  if (weakTopics.length === 0) {
    return [];
  }

  // Filter available resources by relevant subject if possible
  const examSubject = String((report as any).subject || report.examTitle || "").toLowerCase();
  const relevantResources = availableResources.filter((res) => {
    if (!res.url || !res.title) return false;
    const resSubject = (res.subject || "").toLowerCase();
    if (examSubject && resSubject && !examSubject.includes(resSubject) && !resSubject.includes(examSubject)) {
      // Keep if no other resources exist
      return true;
    }
    return true;
  });

  // Resources catalogue summary for Gemini (NO hallucination allowed)
  const resourceCatalog = relevantResources.map((r) => ({
    resourceId: r.id,
    title: r.title,
    type: r.type,
    subject: r.subject,
    grade: r.grade,
    description: r.description || "",
    url: r.url,
  }));

  // Build structured prompt for Gemini
  const weakTopicsSummary = weakTopics.map((wt) => ({
    topic: wt.topic,
    accuracy: `${wt.accuracy}%`,
    questionsAttempted: `${wt.correctCount}/${wt.totalQuestions} correct`,
    incorrectQuestions: wt.incorrectQuestions.map(
      (iq) => `Q${iq.questionNumber}: "${iq.questionText}" (Student answered: "${iq.studentAnswer}", Correct: "${iq.correctAnswer}")`
    ),
  }));

  const prompt = `You are ZeePrep AI Academic Remediation Engine.
Your task is to analyze student weak areas from an exam and recommend ACTUAL uploaded learning resources.

STUDENT WEAK AREAS (Factual Data):
${JSON.stringify(weakTopicsSummary, null, 2)}

CATALOGUE OF REAL UPLOADED ZEEPREP RESOURCES:
${JSON.stringify(resourceCatalog, null, 2)}

INSTRUCTIONS:
1. For each weak topic, provide a concise, factual diagnosis (1 sentence) and specific evidence based on questions missed.
2. Match up to 3 most relevant resources from the CATALOGUE OF REAL UPLOADED ZEEPREP RESOURCES that actually cover and explain the missed topic concepts.
3. CRITICAL RULES:
   - You MUST ONLY select resources that exist in the provided catalogue. Use their exact resourceId, title, and type. NEVER invent or fabricate resource IDs or URLs.
   - If a topic is not given in any uploaded content, or is not sufficiently described/explained in the catalogue, return an empty "resources": [] array so the student is prompted to ask their teacher.

Return ONLY a JSON array matching this exact schema:
[
  {
    "topic": string,
    "diagnosis": string,
    "evidence": string[],
    "resources": [
      {
        "resourceId": string,
        "reason": string,
        "relevance": "high" | "medium"
      }
    ]
  }
]`;

  try {
    const aiResponseText = await callGeminiAPI(prompt, "weakTopicRemediation");

    if (aiResponseText) {
      const cleanJson = aiResponseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsedAI = JSON.parse(jsonMatch[0]) as any[];

        if (Array.isArray(parsedAI) && parsedAI.length > 0) {
          const results: WeakTopicAnalysis[] = weakTopics.map((wt) => {
            const aiItem = parsedAI.find(
              (p) => String(p.topic || "").trim().toLowerCase() === wt.topic.trim().toLowerCase()
            );

            let recommendedResources: WeakTopicResourceRecommendation[] = [];

            if (aiItem && Array.isArray(aiItem.resources) && aiItem.resources.length > 0) {
              aiItem.resources.forEach((rObj: any) => {
                const matchedCatalogItem = resourceCatalog.find((c) => c.resourceId === rObj.resourceId);
                if (matchedCatalogItem) {
                  recommendedResources.push({
                    resourceId: matchedCatalogItem.resourceId,
                    title: matchedCatalogItem.title,
                    type: matchedCatalogItem.type,
                    url: matchedCatalogItem.url,
                    relevance: rObj.relevance === "high" ? "high" : "medium",
                    reason: String(rObj.reason || `Targeted practice for ${wt.topic}`),
                  });
                }
              });
            }

            // Fallback to local matching if AI returned no catalogue matches but resources exist
            if (recommendedResources.length === 0 && relevantResources.length > 0) {
              recommendedResources = matchResourcesLocally(wt, relevantResources);
            }

            return {
              topic: wt.topic,
              accuracy: wt.accuracy,
              totalQuestions: wt.totalQuestions,
              correctCount: wt.correctCount,
              wrongCount: wt.wrongCount,
              unansweredCount: wt.unansweredCount,
              diagnosis:
                aiItem?.diagnosis ||
                `Needs additional conceptual revision and numerical practice in ${wt.topic}.`,
              evidence:
                aiItem?.evidence ||
                wt.incorrectQuestions.map((iq) => `Missed Question ${iq.questionNumber}`),
              recommendedResources,
            };
          });

          return results;
        }
      }
    }
  } catch (err) {
    console.warn("[WeakTopicEngine] AI recommendation call failed, using deterministic matching:", err);
  }

  // Pure Deterministic Fallback (AI failure NEVER breaks report generation)
  return weakTopics.map((wt) => ({
    topic: wt.topic,
    accuracy: wt.accuracy,
    totalQuestions: wt.totalQuestions,
    correctCount: wt.correctCount,
    wrongCount: wt.wrongCount,
    unansweredCount: wt.unansweredCount,
    diagnosis: `Needs structured practice and concept review in ${wt.topic} (${wt.accuracy}% accuracy).`,
    evidence: wt.incorrectQuestions.map((iq) => `Missed Question ${iq.questionNumber}`),
    recommendedResources: matchResourcesLocally(wt, relevantResources),
  }));
}
