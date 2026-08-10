export interface NormalizedOption {
  id: string;
  text: string;
}

export interface NormalizedQuestion {
  id: string;
  text: string;
  options: NormalizedOption[];
  correctOption?: number | string;
  explanation?: string;
  marks: number;
  level: string;
  subject: string;
}

/**
 * Safely normalizes a question option that can either be a string ("Photosynthesis")
 * or an object ({ id: "A", text: "Photosynthesis" } or { label: "A", value: "..." }).
 */
export function normalizeQuestionOption(opt: any, index: number): NormalizedOption {
  const fallbackId = String.fromCharCode(65 + index);

  if (opt === null || opt === undefined) {
    return { id: fallbackId, text: "" };
  }

  if (typeof opt === "string" || typeof opt === "number") {
    return { id: fallbackId, text: String(opt) };
  }

  if (typeof opt === "object") {
    const textVal =
      opt.text ??
      opt.value ??
      opt.label ??
      opt.optionText ??
      opt.option ??
      "";
    const idVal = opt.id ?? opt.key ?? fallbackId;

    return {
      id: String(idVal),
      text: typeof textVal === "object" ? JSON.stringify(textVal) : String(textVal),
    };
  }

  return { id: fallbackId, text: String(opt) };
}

/**
 * Safely normalizes a whole question object from Firestore.
 */
export function normalizeQuestion(q: any): NormalizedQuestion {
  if (!q || typeof q !== "object") {
    return {
      id: String(Math.random()),
      text: "Untitled Question",
      options: [],
      marks: 1,
      level: "level1",
      subject: "General",
    };
  }

  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const normalizedOpts = rawOptions.map((opt: any, idx: number) => normalizeQuestionOption(opt, idx));

  return {
    id: String(q.id || Math.random()),
    text: String(q.text || q.questionText || q.question || "Untitled Question"),
    options: normalizedOpts,
    correctOption: q.correctOption ?? q.answer ?? q.correctAnswer,
    explanation: q.explanation ? String(q.explanation) : undefined,
    marks: Number(q.marks) || 1,
    level: String(q.level || "level1"),
    subject: String(q.subject || "General"),
  };
}
