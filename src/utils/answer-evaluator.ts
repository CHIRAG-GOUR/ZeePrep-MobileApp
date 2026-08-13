/**
 * Authoritative Answer Evaluator & Canonical Option Normalizer
 * Guarantees 100% deterministic correctness calculation across all question types
 * (Excel imports, AI generated, Teacher custom, Firestore legacy).
 */

export interface CanonicalOption {
  index: number; // 0, 1, 2, 3
  letter: string; // "A", "B", "C", "D"
  label: string; // "Option A", "Option B"
  text: string; // "Newton (N)"
  cleanText: string; // "newton (n)"
}

export function extractCanonicalOptions(rawOptions: any[]): CanonicalOption[] {
  if (!Array.isArray(rawOptions)) return [];
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return rawOptions.map((opt, idx) => {
    const letter = letters[idx] || String.fromCharCode(65 + idx);
    let text = "";

    if (opt === null || opt === undefined) {
      text = "";
    } else if (typeof opt === "string" || typeof opt === "number") {
      text = String(opt).trim();
    } else if (typeof opt === "object") {
      text = String(
        opt.text ?? opt.value ?? opt.label ?? opt.optionText ?? opt.option ?? ""
      ).trim();
    }

    return {
      index: idx,
      letter,
      label: `Option ${letter}`,
      text,
      cleanText: text.toLowerCase().trim(),
    };
  });
}

/**
 * Maps any answer representation (text, 0-based index, letter A-D, label "Option A", object)
 * to its 0-based option index within canonicalOptions. Returns -1 if unmapped.
 */
export function resolveOptionIndex(ans: any, canonicalOptions: CanonicalOption[]): number {
  if (ans === undefined || ans === null || ans === "") return -1;

  // If ans is an object
  if (typeof ans === "object") {
    if (ans.index !== undefined && typeof ans.index === "number") return ans.index;
    if (ans.id && typeof ans.id === "string") return resolveOptionIndex(ans.id, canonicalOptions);
    if (ans.text && typeof ans.text === "string") return resolveOptionIndex(ans.text, canonicalOptions);
    if (ans.value && typeof ans.value === "string") return resolveOptionIndex(ans.value, canonicalOptions);
  }

  const strVal = String(ans).trim();
  const cleanVal = strVal.toLowerCase();

  // 1. Check if ans is numeric index (e.g. 0, 1, 2, 3 or "0", "1", "2", "3")
  const numVal = Number(strVal);
  if (!isNaN(numVal) && Number.isInteger(numVal) && numVal >= 0 && numVal < canonicalOptions.length) {
    return numVal;
  }

  // 2. Check if ans is single letter ("A", "B", "C", "D" or "a", "b", "c", "d")
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
  if (cleanVal.length === 1 && letters.includes(cleanVal)) {
    const lIdx = letters.indexOf(cleanVal);
    if (lIdx < canonicalOptions.length) return lIdx;
  }

  // 3. Check if ans is "Option A", "Option B", "Option 1", "Option 2"
  const optionMatch = cleanVal.match(/^option\s*([a-h1-8])$/i);
  if (optionMatch) {
    const char = optionMatch[1].toLowerCase();
    const isNum = !isNaN(Number(char));
    const idx = isNum ? Number(char) - 1 : letters.indexOf(char);
    if (idx >= 0 && idx < canonicalOptions.length) return idx;
  }

  // 4. Exact text match
  const exactOpt = canonicalOptions.find((o) => o.cleanText === cleanVal);
  if (exactOpt) return exactOpt.index;

  // 5. Trimmed substring match (e.g. "Newton (N)" vs "Newton")
  if (cleanVal.length > 2) {
    const subOpt = canonicalOptions.find(
      (o) => o.cleanText.length > 2 && (o.cleanText.includes(cleanVal) || cleanVal.includes(o.cleanText))
    );
    if (subOpt) return subOpt.index;
  }

  return -1;
}

export interface EvaluationResult {
  isAnswered: boolean;
  isCorrect: boolean;
  studentOptionIndex: number;
  correctOptionIndex: number;
  canonicalStudentAnswer: string;
  canonicalCorrectAnswer: string;
}

/**
 * Authoritative evaluation of a single student response against a question.
 */
export function evaluateQuestionAnswer(studentAns: any, question: any): EvaluationResult {
  const isAnswered = studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== "";
  const canonicalOpts = extractCanonicalOptions(question.options || []);

  const correctIndex = resolveOptionIndex(question.correctAnswer, canonicalOpts);
  const studentIndex = isAnswered ? resolveOptionIndex(studentAns, canonicalOpts) : -1;

  let isCorrect = false;

  if (isAnswered) {
    if (studentIndex !== -1 && correctIndex !== -1) {
      isCorrect = studentIndex === correctIndex;
    } else {
      // Fallback direct string comparison
      const cleanStudent = String(studentAns).trim().toLowerCase();
      const cleanCorrect = String(question.correctAnswer ?? "").trim().toLowerCase();
      isCorrect = cleanStudent === cleanCorrect;
    }
  }

  // Determine printable canonical representations
  let canonicalStudentAnswer = "";
  if (isAnswered) {
    if (studentIndex >= 0 && studentIndex < canonicalOpts.length) {
      canonicalStudentAnswer = `${canonicalOpts[studentIndex].letter}. ${canonicalOpts[studentIndex].text}`;
    } else {
      canonicalStudentAnswer = String(studentAns).trim();
    }
  }

  let canonicalCorrectAnswer = "";
  if (correctIndex >= 0 && correctIndex < canonicalOpts.length) {
    canonicalCorrectAnswer = `${canonicalOpts[correctIndex].letter}. ${canonicalOpts[correctIndex].text}`;
  } else {
    canonicalCorrectAnswer = String(question.correctAnswer ?? "").trim();
  }

  return {
    isAnswered,
    isCorrect,
    studentOptionIndex: studentIndex,
    correctOptionIndex: correctIndex,
    canonicalStudentAnswer,
    canonicalCorrectAnswer,
  };
}
