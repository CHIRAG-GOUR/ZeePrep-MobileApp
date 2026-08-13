import type { QuestionLevel } from "../types";

export interface ParsedQuestionRow {
  rowNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks?: number;
  rawMarks?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  level?: QuestionLevel;
  isValid: boolean;
  errorReason?: string;
}

export interface SheetValidationResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  totalMarks: number;
  rows: ParsedQuestionRow[];
}

/**
 * Normalizes header string to standard column key
 */
function normalizeHeaderKey(header: string): string {
  const clean = header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  if (["question", "questiontext", "qtext", "stem", "item"].includes(clean)) return "question";
  if (["optiona", "opta", "choicea", "a"].includes(clean)) return "optionA";
  if (["optionb", "optb", "choiceb", "b"].includes(clean)) return "optionB";
  if (["optionc", "optc", "choicec", "c"].includes(clean)) return "optionC";
  if (["optiond", "optd", "choiced", "d"].includes(clean)) return "optionD";
  if (["correctanswer", "answer", "ans", "correct", "key"].includes(clean)) return "correctAnswer";
  if (["marks", "mark", "questionmarks", "maximummarks", "maxmarks", "score", "weight"].includes(clean)) return "marks";
  if (["subject", "sub"].includes(clean)) return "subject";
  if (["topic", "chapter", "concept"].includes(clean)) return "topic";
  if (["level", "difficulty"].includes(clean)) return "level";

  return clean;
}

/**
 * Split CSV line preserving quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses raw Question Sheet text (CSV / TSV / JSON / Sheet format) and performs strict validation
 */
export function parseQuestionSheet(rawText: string): SheetValidationResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      totalRows: 0,
      validCount: 0,
      errorCount: 0,
      totalMarks: 0,
      rows: [],
    };
  }

  // Handle JSON input
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsedJson = JSON.parse(trimmed);
      const items = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
      const rows: ParsedQuestionRow[] = items.map((item, idx) => {
        const rowNum = idx + 1;
        const qText = String(item.question || item.questionText || item.text || "").trim();
        const optA = String(item.optionA || item.options?.[0] || "").trim();
        const optB = String(item.optionB || item.options?.[1] || "").trim();
        const optC = String(item.optionC || item.options?.[2] || "").trim();
        const optD = String(item.optionD || item.options?.[3] || "").trim();
        const correctAns = String(item.correctAnswer || item.answer || item.correct || "").trim();
        const rawMarksVal = item.marks !== undefined ? String(item.marks).trim() : item.mark !== undefined ? String(item.mark).trim() : "";

        return validateParsedRow({
          rowNumber: rowNum,
          questionText: qText,
          options: [optA, optB, optC, optD].filter(Boolean),
          correctAnswer: correctAns,
          rawMarks: rawMarksVal,
          subject: item.subject,
          chapter: item.chapter,
          topic: item.topic,
          level: item.level,
        });
      });

      return computeSummary(rows);
    } catch (e) {
      // Fall through to CSV parsing if JSON parse fails
    }
  }

  // Parse CSV / TSV lines
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { totalRows: 0, validCount: 0, errorCount: 0, totalMarks: 0, rows: [] };
  }

  // First line is header
  const headerLine = lines[0];
  const isTSV = headerLine.includes("\t");
  const headers = isTSV ? headerLine.split("\t").map((h) => h.trim()) : parseCSVLine(headerLine);
  const headerKeys = headers.map(normalizeHeaderKey);

  const rows: ParsedQuestionRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = isTSV ? line.split("\t").map((c) => c.trim()) : parseCSVLine(line);
    if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;

    const rowData: Record<string, string> = {};
    headerKeys.forEach((key, idx) => {
      if (idx < cells.length) {
        rowData[key] = cells[idx];
      }
    });

    const rowNum = i;
    const qText = rowData["question"] || cells[0] || "";
    const optA = rowData["optionA"] || cells[1] || "";
    const optB = rowData["optionB"] || cells[2] || "";
    const optC = rowData["optionC"] || cells[3] || "";
    const optD = rowData["optionD"] || cells[4] || "";
    const correctAns = rowData["correctAnswer"] || cells[5] || "";
    const rawMarksVal = rowData["marks"] !== undefined ? rowData["marks"] : cells[6] !== undefined ? cells[6] : "";

    const parsedRow = validateParsedRow({
      rowNumber: rowNum,
      questionText: qText,
      options: [optA, optB, optC, optD].filter(Boolean),
      correctAnswer: correctAns,
      rawMarks: rawMarksVal,
      subject: rowData["subject"],
      chapter: rowData["chapter"],
      topic: rowData["topic"],
      level: rowData["level"] as QuestionLevel,
    });

    rows.push(parsedRow);
  }

  return computeSummary(rows);
}

/**
 * Validates an extracted question row against explicit marks rules
 */
function validateParsedRow(input: {
  rowNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  rawMarks: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  level?: QuestionLevel;
}): ParsedQuestionRow {
  const { rowNumber, questionText, options, correctAnswer, rawMarks, subject, chapter, topic, level } = input;

  if (!questionText) {
    return {
      rowNumber,
      questionText: "",
      options,
      correctAnswer,
      rawMarks,
      isValid: false,
      errorReason: `Question ${rowNumber}: Question text is missing.`,
    };
  }

  if (options.length < 2) {
    return {
      rowNumber,
      questionText,
      options,
      correctAnswer,
      rawMarks,
      isValid: false,
      errorReason: `Question ${rowNumber}: At least 2 options (Option A & B) are required.`,
    };
  }

  if (!correctAnswer) {
    return {
      rowNumber,
      questionText,
      options,
      correctAnswer: "",
      rawMarks,
      isValid: false,
      errorReason: `Question ${rowNumber}: Correct answer key is missing.`,
    };
  }

  // Strict Marks Validation (Requirement 3)
  if (!rawMarks || rawMarks.trim() === "") {
    return {
      rowNumber,
      questionText,
      options,
      correctAnswer,
      rawMarks: rawMarks || "",
      isValid: false,
      errorReason: `Question ${rowNumber} has a missing marks value. Please specify explicit marks in the sheet.`,
    };
  }

  const numericMarks = parseFloat(rawMarks.trim());
  if (isNaN(numericMarks) || !isFinite(numericMarks)) {
    return {
      rowNumber,
      questionText,
      options,
      correctAnswer,
      rawMarks,
      isValid: false,
      errorReason: `Question ${rowNumber} has an invalid marks value: "${rawMarks}". Please correct the sheet before importing.`,
    };
  }

  if (numericMarks <= 0) {
    return {
      rowNumber,
      questionText,
      options,
      correctAnswer,
      rawMarks,
      isValid: false,
      errorReason: `Question ${rowNumber} has non-positive marks value: ${numericMarks}. Marks must be greater than 0.`,
    };
  }

  return {
    rowNumber,
    questionText,
    options,
    correctAnswer,
    marks: numericMarks,
    rawMarks,
    subject: subject || "Science",
    chapter: chapter || "",
    topic: topic || "",
    level: level || "level1",
    isValid: true,
  };
}

/**
 * Computes overall summary statistics for the parsed sheet
 */
function computeSummary(rows: ParsedQuestionRow[]): SheetValidationResult {
  const totalRows = rows.length;
  const validRows = rows.filter((r) => r.isValid);
  const errorRows = rows.filter((r) => !r.isValid);
  const totalMarks = validRows.reduce((sum, r) => sum + (r.marks || 0), 0);

  return {
    totalRows,
    validCount: validRows.length,
    errorCount: errorRows.length,
    totalMarks,
    rows,
  };
}
