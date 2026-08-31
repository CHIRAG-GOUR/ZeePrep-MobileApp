/**
 * ZeePrep — Evidence-based AI Report Pointers Engine
 * ==================================================
 * Converts a student's ACTUAL report telemetry (+ subject history) into concise,
 * one-line, data-specific pointers grouped into four categories:
 *   Doing Well · Focus More · Watch Out · Next Step
 *
 * Rules enforced:
 *  - Every pointer is grounded in real evidence (topics, errors, marks, accuracy,
 *    time, skips, repeated mistakes, trend, real resources). No generic filler.
 *  - Deterministic extraction FIRST guarantees specificity even if Gemini is down.
 *  - Gemini only rephrases within the supplied evidence; output is quality-filtered
 *    and generic/unsupported lines are rejected and replaced by deterministic ones.
 *  - Student-facing voice ("you"), one sentence, ~8–22 words.
 */
import type { Report, DetailedQuestionAnalysis } from "../types";
import { deriveFactualTopicBreakdown, normalizeSubject } from "./weak-topic-resource-engine";
import { callGeminiAPI } from "./ai";

export interface ReportPointers {
  doingWell: string[];
  focusMore: string[];
  watchOut: string[];
  nextSteps: string[];
  source: "ai" | "deterministic";
}

interface TopicOverTime {
  topic: string;
  first: number;
  last: number;
  count: number;
  weakOccurrences: number;
}

interface ReportEvidence {
  subject: string;
  totalErrors: number;
  topErrorTopic?: { topic: string; errors: number };
  lowestTopic?: { topic: string; accuracy: number };
  strongestTopic?: { topic: string; accuracy: number };
  skipped: number;
  totalQuestions: number;
  slowTopic?: { topic: string; ratioPct: number };
  fastWrong: number;
  improvedTopic?: { topic: string; first: number; last: number; count: number };
  decliningTopic?: { topic: string; first: number; last: number };
  repeatedWeakTopic?: { topic: string; occurrences: number };
  subjectTrend: "growth" | "decline" | "stable" | "inconsistent" | "none";
  subjectFirstPct?: number;
  subjectLastPct?: number;
  subjectAssessmentCount: number;
  level3Tested: boolean;
  resource?: { topic: string; title: string };
}

const clampWords = (s: string) => s.replace(/\s+/g, " ").trim();

function scopedSubjectReports(report: Report, all: Report[]): Report[] {
  const key = normalizeSubject(report.subject || "");
  return all
    .filter(
      (r) =>
        normalizeSubject(r.subject || "") === key &&
        Array.isArray(r.detailedAnalysis) &&
        r.detailedAnalysis.length > 0 &&
        typeof r.percentage === "number"
    )
    // dedupe retakes: latest attempt per exam
    .reduce<Report[]>((acc, r) => {
      const idx = acc.findIndex((x) => (x.examId || x.id) === (r.examId || r.id));
      if (idx === -1) acc.push(r);
      else if ((Number(r.attemptNumber || 1)) >= Number(acc[idx].attemptNumber || 1)) acc[idx] = r;
      return acc;
    }, [])
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
}

function slope(nums: number[]): number {
  const n = nums.length;
  if (n < 2) return 0;
  const mx = (n - 1) / 2;
  const my = nums.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - mx) * (nums[i] - my);
    den += (i - mx) * (i - mx);
  }
  return den ? num / den : 0;
}

/** Deterministic evidence extraction from the current report + subject history. */
export function extractReportEvidence(report: Report, allReports: Report[]): ReportEvidence {
  const subject = (report.subject || "this subject").trim();
  const da: DetailedQuestionAnalysis[] = report.detailedAnalysis || [];
  const breakdown = deriveFactualTopicBreakdown(report).filter((t) => t.totalQuestions >= 1);

  // Error concentration
  let topErrorTopic: ReportEvidence["topErrorTopic"];
  let totalErrors = 0;
  breakdown.forEach((t) => {
    const errs = t.wrongCount + t.unansweredCount;
    totalErrors += errs;
    if (errs > 0 && (!topErrorTopic || errs > topErrorTopic.errors)) {
      topErrorTopic = { topic: t.topic, errors: errs };
    }
  });

  const eligible = breakdown.filter((t) => t.totalQuestions >= 2);
  const lowest = [...eligible].sort((a, b) => a.accuracy - b.accuracy)[0];
  const strongest = [...eligible].sort((a, b) => b.accuracy - a.accuracy)[0];
  const lowestTopic = lowest && lowest.accuracy < 70 ? { topic: lowest.topic, accuracy: lowest.accuracy } : undefined;
  const strongestTopic = strongest && strongest.accuracy >= 80 ? { topic: strongest.topic, accuracy: strongest.accuracy } : undefined;

  // Time analysis
  const times = da.map((q) => Math.max(0, Number(q.timeSpentSeconds) || 0));
  const answered = da.filter((q) => !q.isUnanswered);
  const overallAvg = answered.length ? answered.reduce((a, q) => a + (Number(q.timeSpentSeconds) || 0), 0) / answered.length : 0;
  const topicTime = new Map<string, { total: number; n: number; errs: number }>();
  da.forEach((q) => {
    if (q.isUnanswered) return;
    const t = String(q.topic || q.chapter || "General").trim();
    const cur = topicTime.get(t) || { total: 0, n: 0, errs: 0 };
    cur.total += Number(q.timeSpentSeconds) || 0;
    cur.n += 1;
    if (!q.isCorrect) cur.errs += 1;
    topicTime.set(t, cur);
  });
  let slowTopic: ReportEvidence["slowTopic"];
  if (overallAvg > 0) {
    topicTime.forEach((v, t) => {
      const avg = v.total / Math.max(1, v.n);
      const ratio = avg / overallAvg;
      if (ratio >= 1.4 && v.errs > 0 && v.n >= 2) {
        const ratioPct = Math.round((ratio - 1) * 100);
        if (!slowTopic || ratioPct > slowTopic.ratioPct) slowTopic = { topic: t, ratioPct };
      }
    });
  }
  const fastWrong = da.filter((q) => !q.isUnanswered && !q.isCorrect && (Number(q.timeSpentSeconds) || 0) > 0 && (Number(q.timeSpentSeconds) || 0) < 8).length;

  // Subject history: trend + per-topic over time
  const scoped = scopedSubjectReports(report, allReports);
  const pcts = scoped.map((r) => Math.round(Number(r.percentage) || 0));
  const subjectAssessmentCount = scoped.length;
  const sl = slope(pcts);
  const vol = (() => {
    if (pcts.length < 2) return 0;
    const m = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    return Math.sqrt(pcts.reduce((a, b) => a + (b - m) * (b - m), 0) / pcts.length);
  })();
  let subjectTrend: ReportEvidence["subjectTrend"] = "none";
  if (pcts.length >= 2) {
    if (vol > 14) subjectTrend = "inconsistent";
    else if (sl >= 3) subjectTrend = "growth";
    else if (sl <= -3) subjectTrend = "decline";
    else subjectTrend = "stable";
  }

  // per-topic first/last accuracy across scoped reports
  const topicSeries = new Map<string, { acc: number }[]>();
  scoped.forEach((r) => {
    const b = deriveFactualTopicBreakdown(r);
    b.forEach((t) => {
      if (t.totalQuestions < 1) return;
      const arr = topicSeries.get(t.topic) || [];
      arr.push({ acc: t.accuracy });
      topicSeries.set(t.topic, arr);
    });
  });
  let improvedTopic: ReportEvidence["improvedTopic"];
  let decliningTopic: ReportEvidence["decliningTopic"];
  let repeatedWeakTopic: ReportEvidence["repeatedWeakTopic"];
  topicSeries.forEach((arr, topic) => {
    if (arr.length >= 2) {
      const first = arr[0].acc;
      const last = arr[arr.length - 1].acc;
      if (last - first >= 12 && (!improvedTopic || last - first > improvedTopic.last - improvedTopic.first)) {
        improvedTopic = { topic, first, last, count: arr.length };
      }
      if (first - last >= 12 && (!decliningTopic || first - last > decliningTopic.first - decliningTopic.last)) {
        decliningTopic = { topic, first, last };
      }
    }
    const weakOcc = arr.filter((x) => x.acc < 60).length;
    if (weakOcc >= 2 && (!repeatedWeakTopic || weakOcc > repeatedWeakTopic.occurrences)) {
      repeatedWeakTopic = { topic, occurrences: weakOcc };
    }
  });

  // Level 3 tested?
  const level3Tested = da.some((q) => String(q.level) === "level3");

  // Real resource (already resolved at submit time)
  let resource: ReportEvidence["resource"];
  const insights: any[] = (report.weakTopicInsights as any[]) || [];
  for (const wi of insights) {
    const recs = wi?.recommendedResources || [];
    if (recs.length && recs[0]?.title && recs[0]?.resourceId) {
      resource = { topic: wi.topic, title: String(recs[0].title) };
      break;
    }
  }

  return {
    subject,
    totalErrors,
    topErrorTopic,
    lowestTopic,
    strongestTopic,
    skipped: Number(report.unattempted) || 0,
    totalQuestions: Number(report.totalQuestions) || da.length,
    slowTopic,
    fastWrong,
    improvedTopic,
    decliningTopic,
    repeatedWeakTopic,
    subjectTrend,
    subjectFirstPct: pcts[0],
    subjectLastPct: pcts[pcts.length - 1],
    subjectAssessmentCount,
    level3Tested,
    resource,
  };
}

/** Deterministic, inherently-specific pointers built directly from evidence. */
export function buildDeterministicPointers(e: ReportEvidence): ReportPointers {
  const doingWell: string[] = [];
  const focusMore: string[] = [];
  const watchOut: string[] = [];
  const nextSteps: string[] = [];

  // DOING WELL
  if (e.improvedTopic) {
    doingWell.push(`${e.improvedTopic.topic} is improving — accuracy rose from ${e.improvedTopic.first}% to ${e.improvedTopic.last}% across ${e.improvedTopic.count} assessments.`);
  }
  if (e.strongestTopic && e.strongestTopic.topic !== e.improvedTopic?.topic) {
    doingWell.push(`${e.strongestTopic.topic} is a strength — you scored ${e.strongestTopic.accuracy}% on it this assessment.`);
  }
  if (doingWell.length === 0 && e.subjectTrend === "growth" && e.subjectFirstPct != null && e.subjectLastPct != null) {
    doingWell.push(`Your ${e.subject} scores rose from ${e.subjectFirstPct}% to ${e.subjectLastPct}% over ${e.subjectAssessmentCount} assessments.`);
  }

  // FOCUS MORE
  if (e.topErrorTopic && e.topErrorTopic.errors >= 2 && e.totalErrors >= 2) {
    focusMore.push(`Revisit ${e.topErrorTopic.topic} — ${e.topErrorTopic.errors} of your ${e.totalErrors} errors this test came from it.`);
  }
  if (e.lowestTopic && e.lowestTopic.topic !== e.topErrorTopic?.topic) {
    focusMore.push(`Revise ${e.lowestTopic.topic} — it is your lowest topic at ${e.lowestTopic.accuracy}% this assessment.`);
  }
  if (e.repeatedWeakTopic && e.repeatedWeakTopic.topic !== e.topErrorTopic?.topic && e.repeatedWeakTopic.topic !== e.lowestTopic?.topic) {
    focusMore.push(`${e.repeatedWeakTopic.topic} keeps recurring as a weak area across recent assessments.`);
  }

  // WATCH OUT
  if (e.subjectTrend === "decline") {
    watchOut.push(`Your ${e.subject} accuracy has slipped over recent assessments — address it before boards.`);
  } else if (e.decliningTopic) {
    watchOut.push(`${e.decliningTopic.topic} is dropping — accuracy fell from ${e.decliningTopic.first}% to ${e.decliningTopic.last}%.`);
  }
  if (e.slowTopic) {
    watchOut.push(`You spend about ${e.slowTopic.ratioPct}% longer on ${e.slowTopic.topic} questions — refine your method.`);
  } else if (e.fastWrong >= 2) {
    watchOut.push(`${e.fastWrong} wrong answers were submitted very quickly — pause to verify before moving on.`);
  }
  if (watchOut.length === 0 && e.skipped > 0 && e.totalQuestions > 0 && e.skipped / e.totalQuestions >= 0.2) {
    watchOut.push(`You left ${e.skipped} of ${e.totalQuestions} questions unanswered — practise pacing to attempt them all.`);
  }
  if (watchOut.length === 0 && e.subjectTrend === "inconsistent") {
    watchOut.push(`Your ${e.subject} scores swing between assessments — building consistency is the next goal.`);
  }

  // NEXT STEP
  if (e.resource) {
    nextSteps.push(`Revise ${e.resource.topic} using the "${e.resource.title}" resource before your next assessment.`);
  }
  const weakForAction = e.lowestTopic?.topic || e.topErrorTopic?.topic || e.repeatedWeakTopic?.topic;
  if (weakForAction && nextSteps.length < 2) {
    nextSteps.push(`Practise a focused set on ${weakForAction} before your next ${e.subject} assessment.`);
  }
  if (!e.level3Tested) {
    nextSteps.push(`Attempt a Level 3 ${e.subject} set to test your board-level readiness.`);
  }
  if (nextSteps.length === 0) {
    nextSteps.push(`Keep practising advanced ${e.subject} questions to maintain your preparation.`);
  }

  return {
    doingWell: doingWell.slice(0, 3),
    focusMore: focusMore.slice(0, 3),
    watchOut: watchOut.slice(0, 2),
    nextSteps: nextSteps.slice(0, 3),
    source: "deterministic",
  };
}

// ── Quality filter for AI-produced pointers ──
const GENERIC_RX = /^(keep|stay|continue|be sure to|make sure to|try to|remember to)?\s*(practi[cs]e|revise|study|focus|work|prepare|manage your time|stay consistent|keep going|work hard|do your best)\b[^.]*$/i;

function wordCount(s: string): number {
  return clampWords(s).split(" ").filter(Boolean).length;
}

function isSpecific(s: string, knownTopics: string[], subject: string): boolean {
  const hasNumber = /\d/.test(s);
  const lower = s.toLowerCase();
  const hasTopic = knownTopics.some((t) => t && lower.includes(t.toLowerCase()));
  const mentionsSubject = !!subject && lower.includes(subject.toLowerCase());
  return hasNumber || hasTopic || mentionsSubject;
}

function filterPointers(list: any, knownTopics: string[], subject: string, max: number): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    let s = clampWords(String(raw || "")).replace(/^[-*•\d.)\s]+/, "").replace(/[`*#]/g, "");
    if (!s) continue;
    const wc = wordCount(s);
    if (wc < 5 || wc > 26) continue;
    if (GENERIC_RX.test(s) && !isSpecific(s, knownTopics, subject)) continue;
    if (!isSpecific(s, knownTopics, subject)) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    if (!/[.!?]$/.test(s)) s += ".";
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function buildPointerPrompt(e: ReportEvidence, r: Report): string {
  const facts: string[] = [];
  if (e.topErrorTopic) facts.push(`Most errors this test: ${e.topErrorTopic.topic} (${e.topErrorTopic.errors} of ${e.totalErrors} errors).`);
  if (e.lowestTopic) facts.push(`Lowest topic this test: ${e.lowestTopic.topic} at ${e.lowestTopic.accuracy}%.`);
  if (e.strongestTopic) facts.push(`Strongest topic this test: ${e.strongestTopic.topic} at ${e.strongestTopic.accuracy}%.`);
  if (e.improvedTopic) facts.push(`Improving over time: ${e.improvedTopic.topic} ${e.improvedTopic.first}% -> ${e.improvedTopic.last}% across ${e.improvedTopic.count} assessments.`);
  if (e.decliningTopic) facts.push(`Declining over time: ${e.decliningTopic.topic} ${e.decliningTopic.first}% -> ${e.decliningTopic.last}%.`);
  if (e.repeatedWeakTopic) facts.push(`Repeatedly weak: ${e.repeatedWeakTopic.topic} (weak in ${e.repeatedWeakTopic.occurrences} assessments).`);
  if (e.slowTopic) facts.push(`Time issue: ~${e.slowTopic.ratioPct}% longer on ${e.slowTopic.topic} questions, with errors.`);
  if (e.fastWrong >= 2) facts.push(`${e.fastWrong} wrong answers submitted in under 8 seconds.`);
  if (e.skipped > 0) facts.push(`${e.skipped} of ${e.totalQuestions} questions left unanswered.`);
  facts.push(`Subject trend: ${e.subjectTrend} across ${e.subjectAssessmentCount} ${e.subject} assessments (${e.subjectFirstPct}% -> ${e.subjectLastPct}%).`);
  if (!e.level3Tested) facts.push(`No Level 3 questions attempted yet.`);
  if (e.resource) facts.push(`Available ZeePrep resource for ${e.resource.topic}: "${e.resource.title}".`);

  return `You are a ZeePrep academic mentor writing short pointers for a student about their ${e.subject} report (scored ${r.percentage}%).

EVIDENCE (use ONLY this — do not invent topics, numbers, resources or trends):
${facts.map((f) => "- " + f).join("\n")}

Write concise, student-facing pointers. Rules:
- Speak directly to the student ("you"), one sentence each, about 8 to 20 words.
- Every pointer MUST reference a specific topic, number or trend from the evidence.
- NEVER write generic advice like "practice more", "revise regularly" or "manage your time".
- Only mention the resource if it is listed above; never invent one.
Return ONLY JSON:
{"doingWell": string[], "focusMore": string[], "watchOut": string[], "nextSteps": string[]}
Counts: doingWell 1-3, focusMore 1-3, watchOut 0-2, nextSteps 1-3.`;
}

function parseJson(raw: string): any {
  try {
    const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const m = clean.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}

/**
 * Produce evidence-based one-line pointers. Deterministic pointers are the
 * guaranteed baseline; Gemini refines tone but every line is quality-filtered
 * and, per category, falls back to deterministic when AI is weak/unavailable.
 */
export async function generateReportPointers(report: Report, allReports: Report[]): Promise<ReportPointers> {
  const evidence = extractReportEvidence(report, allReports);
  const deterministic = buildDeterministicPointers(evidence);

  const knownTopics = deriveFactualTopicBreakdown(report).map((t) => t.topic);

  let raw: string | null = null;
  try {
    raw = await callGeminiAPI(buildPointerPrompt(evidence, report), "reportPointers");
  } catch {
    raw = null;
  }
  const parsed = raw ? parseJson(raw) : null;
  if (!parsed) return deterministic;

  const ai: ReportPointers = {
    doingWell: filterPointers(parsed.doingWell, knownTopics, evidence.subject, 3),
    focusMore: filterPointers(parsed.focusMore, knownTopics, evidence.subject, 3),
    watchOut: filterPointers(parsed.watchOut, knownTopics, evidence.subject, 2),
    nextSteps: filterPointers(parsed.nextSteps, knownTopics, evidence.subject, 3),
    source: "ai",
  };

  // Per-category fallback: if AI produced nothing usable, use deterministic.
  const merged: ReportPointers = {
    doingWell: ai.doingWell.length ? ai.doingWell : deterministic.doingWell,
    focusMore: ai.focusMore.length ? ai.focusMore : deterministic.focusMore,
    watchOut: ai.watchOut.length ? ai.watchOut : deterministic.watchOut,
    nextSteps: ai.nextSteps.length ? ai.nextSteps : deterministic.nextSteps,
    source: ai.doingWell.length || ai.focusMore.length || ai.nextSteps.length ? "ai" : "deterministic",
  };
  return merged;
}
