import type {
  Exam,
  Question,
  User,
  ExamAttempt,
  Report,
  DetailedQuestionAnalysis,
} from "../types";
import { evaluateQuestionAnswer } from "../utils/answer-evaluator";

export class ReportIntegrityError extends Error {
  constructor(message: string, public details: any) {
    super(message);
    this.name = "ReportIntegrityError";
  }
}

export interface CalculatedReportResult {
  attempt: ExamAttempt;
  report: Report;
  integrityValid: boolean;
}

/**
 * Authoritative Single-Source Report Engine for ZeePrep Mobile.
 * Enforces all 25 integrity requirements deterministically.
 */
export function calculateExamReport(
  exam: Exam,
  questionsSnapshot: Question[],
  user: User,
  answers: Record<string, string | number>,
  timeSpentPerQuestion: Record<string, number> = {},
  attemptNum: number = 1
): CalculatedReportResult {
  // 1. ABSOLUTE SOURCE OF TRUTH: The snapshot questions are the ONLY source of truth
  const totalQuestions = questionsSnapshot.length;

  if (totalQuestions === 0) {
    throw new ReportIntegrityError("Cannot calculate report for 0 questions", {
      examId: exam.id,
      studentId: user.uid,
    });
  }

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let obtainedMarks = 0;
  let maxTimeSecs = -1;
  let maxTimeQuestionObj: any = undefined;

  // 2. Build 1-to-1 Detailed Analysis Records for EVERY snapshot question
  const detailedAnalysis: DetailedQuestionAnalysis[] = questionsSnapshot.map((q, idx) => {
    const studentAns = answers[q.id];
    const evaluation = evaluateQuestionAnswer(studentAns, q);

    const qMarks = q.marks !== undefined && q.marks !== null && !isNaN(Number(q.marks)) ? Number(q.marks) : 1;
    const awardedMarks = evaluation.isCorrect ? qMarks : 0;
    const tSpent = Math.max(0, Math.round(Number(timeSpentPerQuestion[q.id] || 0)));

    if (evaluation.isCorrect) {
      correctCount++;
      obtainedMarks += awardedMarks;
    } else if (evaluation.isAnswered) {
      wrongCount++;
    } else {
      unansweredCount++;
    }

    const qText = String(
      (q as any).text || (q as any).questionText || (q as any).question || `Question ${idx + 1}`
    ).trim();
    const topicStr = String(q.topic || exam.subject || "General").trim();

    if (tSpent > maxTimeSecs) {
      maxTimeSecs = tSpent;
      maxTimeQuestionObj = {
        questionId: q.id,
        questionNumber: idx + 1,
        questionText: qText,
        topic: topicStr,
        timeSpentSeconds: tSpent,
      };
    }

    return {
      questionId: q.id,
      questionNumber: idx + 1,
      questionText: qText,
      correctAnswer: evaluation.canonicalCorrectAnswer,
      studentAnswer: evaluation.canonicalStudentAnswer,
      isCorrect: evaluation.isCorrect,
      isUnanswered: !evaluation.isAnswered,
      marks: qMarks,
      awardedMarks,
      timeSpentSeconds: tSpent,
      chapter: q.chapter || "",
      topic: topicStr,
      level: q.level || "level1",
    };
  });

  // 3. INVARIANT CHECK (Requirement 11)
  const invariantSum = correctCount + wrongCount + unansweredCount;
  if (invariantSum !== totalQuestions || detailedAnalysis.length !== totalQuestions) {
    throw new ReportIntegrityError("Report Invariant Violation: correct + wrong + unanswered != totalQuestions", {
      examId: exam.id,
      studentId: user.uid,
      totalQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      invariantSum,
      analysisCount: detailedAnalysis.length,
    });
  }

  // 4. Calculate total possible marks & percentage
  const totalPossibleMarks = questionsSnapshot.reduce(
    (sum, q) => sum + (q.marks !== undefined && q.marks !== null && !isNaN(Number(q.marks)) ? Number(q.marks) : 1),
    0
  );

  obtainedMarks = Math.max(0, obtainedMarks);
  const percentage = totalPossibleMarks > 0 ? Math.round((obtainedMarks / totalPossibleMarks) * 100) : 0;
  const passed = obtainedMarks >= (exam.passingMarks || Math.ceil(totalPossibleMarks * 0.33));

  const totalTimeSpentSeconds = Object.values(timeSpentPerQuestion).reduce(
    (acc, curr) => acc + Math.max(0, Math.round(Number(curr || 0))),
    0
  );
  const accuracy = Math.round((correctCount / Math.max(1, correctCount + wrongCount)) * 100);

  // 5. Build ID
  const cleanStudent = (user.uid || "student").replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanExam = (exam.id || "exam").replace(/[^a-zA-Z0-9_-]/g, "");
  const suffix = attemptNum === 1 ? "" : `_att${attemptNum}`;
  const docId = `${cleanStudent}_${cleanExam}${suffix}`;

  const mostTimeSpentQuestion = maxTimeQuestionObj && maxTimeSecs > 0 ? maxTimeQuestionObj : undefined;
  const mostTimeSpentTopic = mostTimeSpentQuestion?.topic || (exam.subject || "General");

  const attempt: ExamAttempt = {
    id: docId,
    examId: exam.id,
    studentId: user.uid,
    studentName: user.name,
    studentEmail: user.email,
    status: "submitted",
    attemptNumber: attemptNum,
    maxAttempts: exam.maxAttempts || 1,
    answers,
    markedForReview: [],
    revisitedQuestions: [],
    timeSpentPerQuestion,
    score: obtainedMarks,
    percentage,
    passed,
    startedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    // Snapshot exact question list into attempt
    questions: questionsSnapshot as any,
  };

  const report: Report = {
    id: docId,
    examId: exam.id,
    examTitle: exam.title,
    subject: exam.subject || "",
    schoolId: (user as any).schoolId || (exam as any).schoolId || "",
    schoolName: (user as any).schoolName || "",
    teacherId: (exam as any).teacherId || (exam as any).createdBy || "",
    studentId: user.uid,
    studentName: user.name,
    studentEmail: user.email,
    attemptNumber: attemptNum,
    maxAttempts: exam.maxAttempts || 1,
    board: user.board || "CBSE",
    grade: user.grade || "10",
    section: user.section || "A",
    stream: user.stream || "Science",
    totalMarks: totalPossibleMarks,
    obtainedMarks,
    percentage,
    passed,
    totalQuestions,
    correctAnswers: correctCount,
    incorrectAnswers: wrongCount,
    unattempted: unansweredCount,
    timeSpentSeconds: totalTimeSpentSeconds,
    accuracy,
    detailedAnalysis,
    mostTimeSpentQuestion,
    mostTimeSpentTopic,
    createdAt: new Date().toISOString(),
  };

  // 6. VALIDATE REPORT INTEGRITY BEFORE RETURNING
  if (
    isNaN(percentage) ||
    !isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100 ||
    obtainedMarks > totalPossibleMarks ||
    obtainedMarks < 0
  ) {
    throw new ReportIntegrityError("Report Integrity Check Failed: invalid numerical score or percentage", {
      percentage,
      obtainedMarks,
      totalPossibleMarks,
    });
  }

  console.log(`[ReportEngine] Calculated Report ${docId}:`, {
    totalQuestions,
    correctCount,
    wrongCount,
    unansweredCount,
    obtainedMarks,
    totalPossibleMarks,
    percentage,
  });

  return {
    attempt,
    report,
    integrityValid: true,
  };
}
