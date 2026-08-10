import type { Report } from "../types";

export interface AIGeneratedQuestionSuggestion {
  text: string;
  type: "mcq" | "numerical" | "assertion-reason" | "subjective";
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subject: string;
  grade: string;
  topic: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Direct Gemini API call wrapper
async function callGeminiAPI(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("Gemini API request failed:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText || null;
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    return null;
  }
}

// AI Student Tutor Assistant Response Generator
export async function generateAITutorResponse(
  userQuery: string,
  grade: string = "12",
  stream: string = "Science"
): Promise<string> {
  const prompt = `You are ZeePrep AI Study Assistant, an expert tutor for Grade ${grade} (${stream} stream). 
Student Question: "${userQuery}"

Provide a clear, encouraging, step-by-step diagnostic breakdown. Use bullet points and clear formatting. Keep it concise for a mobile screen.`;

  const geminiResponse = await callGeminiAPI(prompt);
  if (geminiResponse) {
    return geminiResponse;
  }

  // Intelligent fallback if API key is not configured or offline
  const queryText = userQuery.toLowerCase();
  if (queryText.includes("formula")) {
    return `Key Formulas for Grade ${grade} (${stream}):\n• Force (F) = m * a\n• Work (W) = F * d * cos(θ)\n• Kinetic Energy = 1/2 * m * v²\n• Potential Energy = m * g * h`;
  } else if (queryText.includes("exam") || queryText.includes("prep")) {
    return `ZeePrep Recommended Exam Strategy:\n1. Solve Level 1 diagnostic questions to build confidence.\n2. Practice Level 2 numericals under timed conditions.\n3. Review your diagnostic scorecard to address weak areas.`;
  }

  return `Diagnostic Breakdown for "${userQuery}":\n\n1. Core Concept: Focus on fundamental principles in Grade ${grade} ${stream}.\n2. Step-by-Step Approach: Identify given values, select the right equation, and solve.\n3. Exam Tip: Review units and show intermediate steps for full marks.`;
}

// AI Teacher Question Bank Generator
export async function suggestQuestionItems(
  subject: string,
  grade: string,
  topic: string,
  count: number = 3
): Promise<AIGeneratedQuestionSuggestion[]> {
  const prompt = `Generate ${count} curriculum-aligned exam questions for Subject: ${subject}, Grade: ${grade}, Topic: ${topic || "Core Syllabus"}.
Return ONLY a valid JSON array of objects with keys: text, type ("mcq"|"numerical"), options (array of 4 strings for mcq), correctAnswer, explanation, difficulty ("easy"|"medium"|"hard").`;

  const geminiText = await callGeminiAPI(prompt);
  if (geminiText) {
    try {
      const cleanJson = geminiText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          ...item,
          subject,
          grade,
          topic: topic || "Core",
        }));
      }
    } catch (e) {
      console.warn("Could not parse Gemini JSON response for questions:", e);
    }
  }

  // Fallback defaults
  return [
    {
      text: `Explain the fundamental principles governing ${topic || "Newtonian Physics"} in ${subject}.`,
      type: "mcq",
      options: [
        "First Law of Motion (Inertia)",
        "Law of Universal Gravitation",
        "Principle of Conservation of Energy",
        "Electromagnetic Wave Propagation",
      ],
      correctAnswer: "First Law of Motion (Inertia)",
      explanation: "Calculated based on standard curriculum guidelines for Grade " + grade,
      difficulty: "medium",
      subject,
      grade,
      topic: topic || "Physics",
    },
    {
      text: `Calculate the net resultant force when two orthogonal vectors of 6N and 8N act on a point mass.`,
      type: "numerical",
      correctAnswer: 10,
      explanation: "Resultant = sqrt(6^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10 N",
      difficulty: "hard",
      subject,
      grade,
      topic: topic || "Vectors",
    },
  ];
}

// AI Teacher & Student Report Diagnostic Analysis
export async function generateTeacherAIReportAnalysis(report: Report): Promise<{
  strongTopics: string[];
  weakTopics: string[];
  recommendation: string;
}> {
  const prompt = `Analyze student exam performance:
Exam Title: ${report.examTitle}. Score: ${report.obtainedMarks}/${report.totalMarks} (${report.accuracy}% accuracy).
Grade: ${report.grade || "12"}. Time Spent: ${Math.round(report.timeSpentSeconds / 60)} minutes.
Return ONLY JSON with keys: strongTopics (string array), weakTopics (string array), recommendation (string).`;

  const geminiText = await callGeminiAPI(prompt);
  if (geminiText) {
    try {
      const cleanJson = geminiText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.strongTopics && parsed.weakTopics && parsed.recommendation) {
        return parsed;
      }
    } catch (e) {
      console.warn("Could not parse Gemini JSON for report analysis:", e);
    }
  }

  const isHighAccuracy = report.accuracy >= 75;
  return {
    strongTopics: isHighAccuracy ? ["Core Concepts", "Formula Applications"] : ["Basic Knowledge"],
    weakTopics: isHighAccuracy ? ["Time Management"] : ["Complex Problem Solving", "Numerical Accuracy"],
    recommendation: isHighAccuracy
      ? "Student displays strong mastery. Recommend Level 3 advanced problem sets."
      : "Student requires targeted revision in core numerical methods. Assign foundational study resources.",
  };
}
