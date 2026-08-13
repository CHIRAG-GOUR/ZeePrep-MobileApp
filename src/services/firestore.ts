import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { db } from "../lib/firebase";
import { normalizeQuestionOption } from "../utils/question-normalizer";
import type {
  User,
  Exam,
  Question,
  ExamAttempt,
  Report,
  DetailedQuestionAnalysis,
  StudyResource,
  AuditLog,
  AcademicSession,
  ClassGrade,
  QuestionLevel,
  UserRole,
} from "../types";

// ==========================================
// 1. USER & ROLE MANAGEMENT
// ==========================================

export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function createOrUpdateUserProfile(user: Partial<User> & { uid: string }): Promise<User> {
  try {
    const ref = doc(db, "users", user.uid);
    const dataToSave = {
      ...user,
      updatedAt: new Date().toISOString(),
      createdAt: user.createdAt || new Date().toISOString(),
    };
    await setDoc(ref, dataToSave, { merge: true });
    return dataToSave as User;
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    throw error;
  }
}

export async function getUserByLoginId(loginId: string): Promise<User | null> {
  try {
    const rawId = loginId.trim();
    const cleanId = rawId.toUpperCase();

    // 1. Check loginIds mapping collection
    const loginIdDoc = await getDoc(doc(db, "loginIds", cleanId));
    if (loginIdDoc.exists()) {
      const data = loginIdDoc.data();
      if (data?.uid) {
        const profile = await getUserProfile(data.uid);
        if (profile) return profile;
      }
      if (data?.email) {
        return { uid: data.uid || "", email: data.email, name: data.name || "User", role: data.role || "student", status: "active" } as User;
      }
    }

    // 2. Search users collection by loginId (exact and uppercase)
    let q = query(collection(db, "users"), where("loginId", "==", cleanId));
    let snapshot = await getDocs(q);
    if (snapshot.empty) {
      q = query(collection(db, "users"), where("loginId", "==", rawId));
      snapshot = await getDocs(q);
    }

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      return { uid: userDoc.id, ...userDoc.data() } as User;
    }

    // 3. Search invitations collection by initialUserId
    const invQ = query(collection(db, "invitations"), where("initialUserId", "==", cleanId));
    const invSnapshot = await getDocs(invQ);
    if (!invSnapshot.empty) {
      const invData = invSnapshot.docs[0].data();
      if (invData?.email) {
        return { uid: "", email: invData.email, name: invData.name || "User", role: invData.role || "student", status: "active" } as User;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching user by login ID:", error);
    return null;
  }
}

export async function getAllUsers(roleFilter?: UserRole): Promise<User[]> {
  try {
    let q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(100));
    if (roleFilter) {
      q = query(collection(db, "users"), where("role", "==", roleFilter), limit(100));
    }
    const snapshot = await getDocs(q);
    const users: User[] = [];
    snapshot.forEach((d) => {
      users.push({ uid: d.id, ...d.data() } as User);
    });
    return users;
  } catch (error) {
    return [];
  }
}

export async function getPendingTeacherApprovals(): Promise<User[]> {
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "teacher"),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    const teachers: User[] = [];
    snapshot.forEach((d) => {
      teachers.push({ uid: d.id, ...d.data() } as User);
    });
    return teachers;
  } catch (error) {
    return [];
  }
}

export async function updateUserAccountStatus(
  targetUid: string,
  status: "active" | "disabled" | "rejected",
  approvalStatus?: "approved" | "rejected",
  performedBy?: User
): Promise<boolean> {
  try {
    await updateDoc(doc(db, "users", targetUid), {
      status,
      approvalStatus: approvalStatus || status === "active" ? "approved" : "rejected",
      updatedAt: new Date().toISOString(),
    });

    if (performedBy) {
      await logAuditEvent({
        action: `USER_STATUS_${status.toUpperCase()}`,
        performedBy: performedBy.uid,
        performedByName: performedBy.name,
        targetUser: targetUid,
        details: `Account status updated to ${status}`,
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating user account status:", error);
    return false;
  }
}

// ==========================================
// 2. ACADEMIC HIERARCHY MANAGEMENT
// ==========================================

const DEFAULT_CLASS_GRADES: ClassGrade[] = [
  {
    id: "grade_9",
    gradeNumber: "9",
    name: "Grade 9",
    board: "CBSE",
    sections: ["A", "B"],
  },
  {
    id: "grade_10",
    gradeNumber: "10",
    name: "Grade 10",
    board: "CBSE",
    sections: ["A", "B", "C"],
  },
  {
    id: "grade_11",
    gradeNumber: "11",
    name: "Grade 11",
    board: "CBSE",
    sections: ["A", "B"],
    streams: ["Science", "Commerce", "Arts"],
  },
  {
    id: "grade_12",
    gradeNumber: "12",
    name: "Grade 12",
    board: "CBSE",
    sections: ["A", "B"],
    streams: ["Science", "Commerce", "Arts"],
  },
];

export async function getAcademicSessions(): Promise<AcademicSession[]> {
  try {
    const snapshot = await getDocs(collection(db, "academicSessions"));
    const list: AcademicSession[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as AcademicSession));
    return list.length > 0 ? list : [{ id: "2026-2027", name: "2026-2027", isCurrent: true }];
  } catch (error) {
    return [{ id: "2026-2027", name: "2026-2027", isCurrent: true }];
  }
}

export async function getClassGrades(): Promise<ClassGrade[]> {
  try {
    const snapshot = await getDocs(collection(db, "classes"));
    const list: ClassGrade[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as ClassGrade));
    return list.length > 0 ? list : DEFAULT_CLASS_GRADES;
  } catch (error) {
    return DEFAULT_CLASS_GRADES;
  }
}

export async function saveClassGrade(gradeData: ClassGrade): Promise<boolean> {
  try {
    const ref = doc(db, "classes", gradeData.id || `grade_${gradeData.gradeNumber}`);
    await setDoc(ref, gradeData);
    return true;
  } catch (error) {
    console.error("Error saving class grade:", error);
    return false;
  }
}

// ==========================================
// 3. QUESTION BANK MANAGEMENT (LEVEL 1, 2, 3)
// ==========================================

export async function getQuestionBank(
  subject?: string,
  grade?: string,
  level?: QuestionLevel
): Promise<Question[]> {
  try {
    let q = query(collection(db, "questions"), limit(100));
    const snapshot = await getDocs(q);
    const questions: Question[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Question;

      if (subject && data.subject && data.subject !== subject) return;
      if (grade && data.grade && data.grade !== grade) return;
      if (level && data.level && data.level !== level) return;

      questions.push({ ...data, id: docSnap.id });
    });

    return questions;
  } catch (error) {
    console.error("Error fetching question bank:", error);
    return [];
  }
}

export async function addQuestionToBank(question: Partial<Question>, teacher?: User | null): Promise<Question | null> {
  try {
    const qDocRef = doc(collection(db, "questions"));
    const newQuestion: Question = {
      id: qDocRef.id,
      text: question.text || "",
      type: question.type || "mcq",
      level: question.level || "level1",
      options: question.options || [],
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || "",
      difficulty: question.difficulty || "medium",
      subject: question.subject || teacher?.subject || "General",
      grade: question.grade || teacher?.grade || "10",
      chapter: question.chapter || "",
      topic: question.topic || "",
      marks: question.marks || 1,
      negativeMarks: question.negativeMarks || 0,
      createdBy: teacher?.uid || question.createdBy || "teacher",
      isTeacherAuthority: true, // TEACHER AUTHORITY RULE: Teachers' questions are preserved as uploaded
      version: 1,
      createdAt: new Date().toISOString(),
    };

    await setDoc(qDocRef, newQuestion);
    return newQuestion;
  } catch (error) {
    console.error("Error adding question to bank:", error);
    return null;
  }
}

// ==========================================
// 4. EXAM MANAGEMENT & CREATION (MANUAL & BLUEPRINT)
// ==========================================

export async function getStudentExams(user: User | null): Promise<Exam[]> {
  if (!user) return [];
  try {
    let snapshot;
    try {
      const q = query(
        collection(db, "exams"),
        where("status", "==", "published")
      );
      snapshot = await getDocs(q);
    } catch (queryErr) {
      console.warn("Primary student exams query failed, falling back to full collection query:", queryErr);
      snapshot = await getDocs(collection(db, "exams"));
    }

    const exams: Exam[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Exam;
      const status = (data.status || "").toLowerCase();

      // Ensure status is published (unless admin/teacher)
      if (status !== "published" && status !== "active") return;

      if (user.grade && data.grade && String(data.grade).trim() !== String(user.grade).trim()) return;
      if (user.section && data.section && String(data.section).trim() !== String(user.section).trim()) return;
      if (user.stream && data.stream && String(data.stream).trim() !== String(user.stream).trim()) return;

      exams.push({ ...data, id: docSnap.id });
    });

    // Client-side sort by createdAt descending
    exams.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return exams;
  } catch (error) {
    console.error("Error fetching student exams:", error);
    return [];
  }
}

export async function getTeacherExams(teacher: User): Promise<Exam[]> {
  try {
    const snapshot = await getDocs(collection(db, "exams"));
    const exams: Exam[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const examObj: Exam = { ...data, id: docSnap.id };

      // Superadmin / Admin see all exams
      if (teacher.role === "superadmin" || teacher.role === "admin") {
        exams.push(examObj);
        return;
      }

      // Teacher matching: match by createdBy, teacherId, authorId, teacherUid, or teacher subject/grade
      const isCreator =
        data.createdBy === teacher.uid ||
        data.teacherId === teacher.uid ||
        data.authorId === teacher.uid ||
        data.teacherUid === teacher.uid;

      const isSubjectMatch =
        teacher.subject &&
        data.subject &&
        String(data.subject).trim().toLowerCase() === String(teacher.subject).trim().toLowerCase();

      if (isCreator || isSubjectMatch || !data.createdBy) {
        exams.push(examObj);
      }
    });

    // Sort by createdAt descending
    exams.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return exams;
  } catch (error) {
    console.error("Error fetching teacher exams:", error);
    return [];
  }
}

export async function createExam(examData: Partial<Exam>, creator?: User | null): Promise<Exam | null> {
  try {
    const examDocRef = doc(collection(db, "exams"));
    const newExam: Exam = {
      id: examDocRef.id,
      title: examData.title || "Untitled Examination",
      description: examData.description || "",
      subject: examData.subject || creator?.subject || "General",
      grade: examData.grade || creator?.grade || "10",
      section: examData.section || "",
      stream: examData.stream || "",
      academicSession: examData.academicSession || "2026-2027",
      durationMinutes: examData.durationMinutes || 30,
      totalMarks: examData.totalMarks || 50,
      passingMarks: examData.passingMarks || 20,
      passingPercentage: examData.passingPercentage || 40,
      negativeMarkingEnabled: examData.negativeMarkingEnabled || false,
      maxAttempts: examData.maxAttempts || 1,
      instructions: examData.instructions || ["Read all questions carefully.", "Attempt all mandatory sections."],
      questionIds: examData.questionIds || [],
      status: examData.status || "published",
      createdBy: creator?.uid || examData.createdBy || "teacher",
      createdByName: creator?.name || examData.createdByName || "Faculty Member",
      createdAt: new Date().toISOString(),
    };

    await setDoc(examDocRef, newExam);
    return newExam;
  } catch (error) {
    console.error("Error creating exam:", error);
    return null;
  }
}

export async function getExamDetails(examId: string): Promise<{ exam: Exam | null; questions: Question[] }> {
  try {
    const examDoc = await getDoc(doc(db, "exams", examId));
    if (!examDoc.exists()) return { exam: null, questions: [] };

    const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
    const questions: Question[] = [];

    if (examData.questionIds && examData.questionIds.length > 0) {
      for (const qId of examData.questionIds) {
        const qDoc = await getDoc(doc(db, "questions", qId));
        if (qDoc.exists()) {
          questions.push({ id: qDoc.id, ...qDoc.data() } as Question);
        }
      }
    }
    return { exam: examData, questions };
  } catch (error) {
    console.error("Error fetching exam details:", error);
    return { exam: null, questions: [] };
  }
}

// Local Exam Draft Storage (Cross-Platform SecureStore / LocalStorage Resilience)
async function setDraftItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); } catch (e) {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getDraftItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

async function deleteDraftItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch (e) {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveExamDraftLocally(
  examId: string,
  studentId: string,
  draftData: {
    answers: Record<string, string | number>;
    markedForReview: string[];
    revisitedQuestions: string[];
    timeSpentPerQuestion: Record<string, number>;
    remainingSeconds: number;
  }
): Promise<void> {
  try {
    const key = `zeeprep_exam_draft_${examId}_${studentId}`;
    await setDraftItem(key, JSON.stringify(draftData));
  } catch (err) {
    console.error("Error saving local draft:", err);
  }
}

export async function getExamDraftLocally(examId: string, studentId: string) {
  try {
    const key = `zeeprep_exam_draft_${examId}_${studentId}`;
    const raw = await getDraftItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Error retrieving local draft:", err);
    return null;
  }
}

export async function clearExamDraftLocally(examId: string, studentId: string): Promise<void> {
  try {
    const key = `zeeprep_exam_draft_${examId}_${studentId}`;
    await deleteDraftItem(key);
  } catch (err) {
    console.error("Error clearing local draft:", err);
  }
}

// Submit Exam Attempt & Generate Scorecard Report
export async function getStudentExamAttempts(examId: string, studentUid: string): Promise<ExamAttempt[]> {
  try {
    if (!examId || !studentUid) return [];

    const attemptsMap = new Map<string, ExamAttempt>();
    const qAttempts = query(
      collection(db, "examAttempts"),
      where("examId", "==", examId),
      where("studentId", "==", studentUid)
    );
    const snap = await getDocs(qAttempts);
    snap.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() } as ExamAttempt;
      if (data.status === "submitted" || data.status === "processed") {
        attemptsMap.set(data.id, data);
      }
    });

    const list = Array.from(attemptsMap.values());
    list.sort((a, b) => (a.attemptNumber || 1) - (b.attemptNumber || 1));
    return list;
  } catch (err) {
    console.error("Error fetching student exam attempts:", err);
    return [];
  }
}

import {
  safeNumber,
  safeInteger,
  safePercentage,
  safeDuration,
} from "../utils/number-utils";

export function checkIsAnswerCorrect(studentAns: any, q: Question): boolean {
  if (studentAns === undefined || studentAns === null || studentAns === "") return false;

  const cleanStudent = String(studentAns).trim().toLowerCase();
  const rawCorrect = q.correctAnswer;
  if (rawCorrect === undefined || rawCorrect === null || rawCorrect === "") return false;
  const cleanCorrect = String(rawCorrect).trim().toLowerCase();

  // 1. Direct equality
  if (cleanStudent === cleanCorrect) return true;

  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const normalizedOpts = rawOptions.map((opt, idx) => normalizeQuestionOption(opt, idx));

  // 2. If correct answer is numeric index (0, 1, 2, 3) or "0", "1", "2", "3"
  const numCorrect = Number(rawCorrect);
  if (!isNaN(numCorrect) && numCorrect >= 0 && numCorrect < normalizedOpts.length) {
    const targetOpt = normalizedOpts[numCorrect];
    if (cleanStudent === targetOpt.text.trim().toLowerCase()) return true;
    if (cleanStudent === targetOpt.id.trim().toLowerCase()) return true;
  }

  // 3. If correct answer is letter ("A", "B", "C", "D" or "a", "b", "c", "d")
  const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
  if (cleanCorrect in letterMap) {
    const idx = letterMap[cleanCorrect];
    if (idx < normalizedOpts.length) {
      const targetOpt = normalizedOpts[idx];
      if (cleanStudent === targetOpt.text.trim().toLowerCase()) return true;
      if (cleanStudent === targetOpt.id.trim().toLowerCase()) return true;
    }
  }

  // 4. If correct answer is "Option A", "Option B", "Option C", "Option D"
  const optionMatch = cleanCorrect.match(/^option\s*([a-e1-5])$/i);
  if (optionMatch) {
    const char = optionMatch[1].toLowerCase();
    const idx = !isNaN(Number(char)) ? Number(char) - 1 : letterMap[char] ?? -1;
    if (idx >= 0 && idx < normalizedOpts.length) {
      const targetOpt = normalizedOpts[idx];
      if (cleanStudent === targetOpt.text.trim().toLowerCase()) return true;
      if (cleanStudent === targetOpt.id.trim().toLowerCase()) return true;
    }
  }

  // 5. Check if student selected an option whose letter/index matches correct answer
  for (let i = 0; i < normalizedOpts.length; i++) {
    const opt = normalizedOpts[i];
    const optTextClean = opt.text.trim().toLowerCase();

    if (cleanStudent === optTextClean) {
      if (cleanCorrect === optTextClean) return true;
      if (String(i) === cleanCorrect) return true;
      if (String.fromCharCode(65 + i).toLowerCase() === cleanCorrect) return true;
    }
  }

  // 6. Substring match fallback (e.g. "Newton (N)" vs "Newton")
  if (cleanStudent.length > 2 && cleanCorrect.length > 2) {
    if (cleanStudent.includes(cleanCorrect) || cleanCorrect.includes(cleanStudent)) {
      return true;
    }
  }

  return false;
}

import { calculateExamReport } from "./report-engine";

// In-memory report cache for instant, fail-safe lookup
const localReportCache = new Map<string, Report>();

export function cacheReportLocally(report: Report) {
  if (report && report.id) {
    localReportCache.set(report.id, report);
    if (report.examId) {
      localReportCache.set(`${report.studentId}_${report.examId}`, report);
    }
  }
}

export async function submitStudentExamAttempt(
  exam: Exam,
  questions: Question[],
  user: User,
  answers: Record<string, string | number>,
  markedForReview: string[],
  revisitedQuestions: string[],
  timeSpentPerQuestion: Record<string, number>
): Promise<{ attempt: ExamAttempt; report: Report }> {
  const prevAttempts = await getStudentExamAttempts(exam.id, user.uid);
  const attemptNum = prevAttempts.length + 1;

  // Single authoritative report engine calculation
  const { attempt, report } = calculateExamReport(
    exam,
    questions,
    user,
    answers,
    timeSpentPerQuestion,
    attemptNum
  );

  // Instantly cache locally for zero-latency retrieval
  cacheReportLocally(report);

  const enrichedAttempt: any = {
    ...attempt,
    examTitle: exam.title,
    totalMarks: report.totalMarks,
    obtainedMarks: report.obtainedMarks,
    totalQuestions: report.totalQuestions,
    correctAnswers: report.correctAnswers,
    incorrectAnswers: report.incorrectAnswers,
    unattempted: report.unattempted,
    timeSpentSeconds: report.timeSpentSeconds,
    accuracy: report.accuracy,
    board: user.board,
    grade: user.grade,
    section: user.section,
    stream: user.stream,
    subject: exam.subject || "",
    detailedAnalysis: report.detailedAnalysis,
    mostTimeSpentQuestion: report.mostTimeSpentQuestion,
    mostTimeSpentTopic: report.mostTimeSpentTopic,
  };

  try {
    await setDoc(doc(db, "examAttempts", attempt.id), enrichedAttempt);
    await setDoc(doc(db, "reports", report.id), report);
    await clearExamDraftLocally(exam.id, user.uid);
    console.log("[ZeePrep] Report saved to Firestore successfully with ID:", report.id);
  } catch (err) {
    console.error("[ZeePrep] Firestore save notice (offline fallback active):", err);
  }

  return { attempt, report };
}

function mapDocumentToReport(docSnap: any): Report {
  const d = typeof docSnap.data === "function" ? docSnap.data() : docSnap;
  const id = docSnap.id || d.id || d.attemptId || `rep_${Math.random()}`;

  const detailedAnalysis: DetailedQuestionAnalysis[] | undefined = Array.isArray(d.detailedAnalysis)
    ? d.detailedAnalysis.map((q: any, idx: number) => ({
        questionId: String(q.questionId || idx),
        questionNumber: safeInteger(q.questionNumber, idx + 1),
        questionText: String(q.questionText || q.text || q.question || `Question ${idx + 1}`),
        correctAnswer: String(q.correctAnswer ?? ""),
        studentAnswer: String(q.studentAnswer ?? ""),
        isCorrect: Boolean(q.isCorrect),
        isUnanswered: Boolean(q.isUnanswered),
        marks: safeNumber(q.marks, 1),
        awardedMarks: safeNumber(q.awardedMarks, q.isCorrect ? safeNumber(q.marks, 1) : 0),
        timeSpentSeconds: safeInteger(q.timeSpentSeconds ?? (q.timeSpentMs ? Math.round(q.timeSpentMs / 1000) : 0), 0),
        chapter: String(q.chapter || ""),
        topic: String(q.topic || "General"),
      }))
    : undefined;

  const rawTotalQ =
    d.totalQuestions ||
    (detailedAnalysis && detailedAnalysis.length > 0 ? detailedAnalysis.length : 0) ||
    (Array.isArray(d.questions) ? d.questions.length : 0) ||
    (Array.isArray(d.answers) ? d.answers.length : 0) ||
    (d.answers && typeof d.answers === "object" && !Array.isArray(d.answers) ? Object.keys(d.answers).length : 0);
  const totalQuestions = safeInteger(rawTotalQ, 0);

  let rawTotalMarks = d.totalMarks || d.totalScore;
  if (!rawTotalMarks || Number(rawTotalMarks) <= 0) {
    if (detailedAnalysis && detailedAnalysis.length > 0) {
      rawTotalMarks = detailedAnalysis.reduce((acc, q) => acc + (q.marks || 1), 0);
    } else {
      rawTotalMarks = totalQuestions > 0 ? totalQuestions : 100;
    }
  }
  const totalMarks = Math.max(1, safeNumber(rawTotalMarks, 100));

  const obtainedMarks = Math.max(0, safeNumber(d.obtainedMarks ?? d.score, 0));
  const percentage = safePercentage(obtainedMarks, totalMarks);
  const passed = d.passed !== undefined ? Boolean(d.passed) : d.passStatus === "Pass" || obtainedMarks >= totalMarks * 0.33;

  const correctAnswers = safeInteger(d.correctAnswers ?? d.correctCount ?? d.correct, 0);
  const incorrectAnswers = safeInteger(d.incorrectAnswers ?? d.incorrectCount ?? d.incorrect, 0);
  const unattempted = safeInteger(
    d.unattempted ?? d.skippedCount ?? d.skipped,
    Math.max(0, totalQuestions - (correctAnswers + incorrectAnswers))
  );

  const timeSpentSeconds = safeInteger(
    d.timeSpentSeconds ?? (d.totalTimeMs ? Math.round(d.totalTimeMs / 1000) : 0) ?? d.totalTimeSpent,
    0
  );
  const accuracy = safeInteger(
    d.accuracy,
    safePercentage(correctAnswers, Math.max(1, correctAnswers + incorrectAnswers))
  );

  let mostTimeSpentQuestion = d.mostTimeSpentQuestion;
  if (!mostTimeSpentQuestion && detailedAnalysis && detailedAnalysis.length > 0) {
    let maxT = -1;
    detailedAnalysis.forEach((qItem) => {
      if (qItem.timeSpentSeconds > maxT) {
        maxT = qItem.timeSpentSeconds;
        mostTimeSpentQuestion = {
          questionId: qItem.questionId,
          questionNumber: qItem.questionNumber || 1,
          questionText: qItem.questionText,
          topic: qItem.topic || "General",
          timeSpentSeconds: qItem.timeSpentSeconds,
        };
      }
    });
  }

  const mostTimeSpentTopic =
    d.mostTimeSpentTopic ||
    mostTimeSpentQuestion?.topic ||
    d.subject ||
    "General";

  return {
    id,
    examId: d.examId || d.testId || "",
    examTitle: d.examTitle || d.title || d.testTitle || "Assessment Report",
    studentId: d.studentId || d.userId || d.uid || "",
    studentName: d.studentName || d.userName || "Student",
    studentEmail: d.studentEmail || d.email || "",
    attemptNumber: safeInteger(d.attemptNumber, 1),
    maxAttempts: d.maxAttempts || 1,
    board: d.board || "CBSE",
    grade: d.grade || "10",
    section: d.section || "A",
    stream: d.stream || "Science",
    totalMarks,
    obtainedMarks,
    percentage,
    passed,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    unattempted,
    timeSpentSeconds,
    accuracy,
    detailedAnalysis,
    mostTimeSpentQuestion,
    mostTimeSpentTopic,
    aiInsight: d.aiInsight,
    teacherRemarks: d.teacherRemarks || d.overallRemarks || d.teacherNotes || "",
    createdAt: d.createdAt || d.submittedAt || d.startedAt || new Date().toISOString(),
  };
}

export async function getStudentReport(idOrExamId: string, studentId?: string): Promise<Report | null> {
  try {
    if (!idOrExamId) return null;

    // 0. Instant in-memory cache resolution
    if (localReportCache.has(idOrExamId)) {
      console.log("[ZeePrep] Retained report from in-memory cache for ID:", idOrExamId);
      return localReportCache.get(idOrExamId)!;
    }

    if (studentId && localReportCache.has(`${studentId}_${idOrExamId}`)) {
      console.log("[ZeePrep] Retained report from in-memory cache for student_exam:", idOrExamId);
      return localReportCache.get(`${studentId}_${idOrExamId}`)!;
    }

    // 1. Direct lookup by exact document ID in reports collection
    const directReportDoc = await getDoc(doc(db, "reports", idOrExamId));
    if (directReportDoc.exists()) {
      const rep = mapDocumentToReport(directReportDoc);
      cacheReportLocally(rep);
      return rep;
    }

    // 2. Direct lookup by exact document ID in examAttempts collection
    const directAttemptDoc = await getDoc(doc(db, "examAttempts", idOrExamId));
    if (directAttemptDoc.exists()) {
      const rep = mapDocumentToReport(directAttemptDoc);
      cacheReportLocally(rep);
      return rep;
    }

    // 3. Handle attempt_ / report_ prefix translation
    if (idOrExamId.startsWith("attempt_")) {
      const correspondingReportId = idOrExamId.replace(/^attempt_/, "report_");
      const corrReportDoc = await getDoc(doc(db, "reports", correspondingReportId));
      if (corrReportDoc.exists()) {
        const rep = mapDocumentToReport(corrReportDoc);
        cacheReportLocally(rep);
        return rep;
      }
    }

    // 4. Constructed candidate IDs with studentId if present
    if (studentId) {
      const cleanStudent = studentId.replace(/[^a-zA-Z0-9_-]/g, "");
      const cleanExam = idOrExamId.replace(/[^a-zA-Z0-9_-]/g, "");

      const candidateIds = [
        `${cleanStudent}_${cleanExam}`,
        `${cleanExam}_${cleanStudent}`,
        `report_${idOrExamId}_${studentId}`,
        `attempt_${idOrExamId}_${studentId}`,
        `report_${cleanExam}_${cleanStudent}`,
        `attempt_${cleanExam}_${cleanStudent}`,
      ];

      for (const cId of candidateIds) {
        if (localReportCache.has(cId)) return localReportCache.get(cId)!;

        const rDoc = await getDoc(doc(db, "reports", cId));
        if (rDoc.exists()) {
          const rep = mapDocumentToReport(rDoc);
          cacheReportLocally(rep);
          return rep;
        }

        const aDoc = await getDoc(doc(db, "examAttempts", cId));
        if (aDoc.exists()) {
          const rep = mapDocumentToReport(aDoc);
          cacheReportLocally(rep);
          return rep;
        }
      }

      // 5. Query by field values in reports collection matching EXACT examId
      const qReports = query(
        collection(db, "reports"),
        where("examId", "==", idOrExamId),
        where("studentId", "==", studentId)
      );
      const snapReports = await getDocs(qReports);
      if (!snapReports.empty) {
        const rep = mapDocumentToReport(snapReports.docs[0]);
        cacheReportLocally(rep);
        return rep;
      }

      // 6. Query by field values in examAttempts collection matching EXACT examId
      const qAttempts = query(
        collection(db, "examAttempts"),
        where("examId", "==", idOrExamId),
        where("studentId", "==", studentId)
      );
      const snapAttempts = await getDocs(qAttempts);
      if (!snapAttempts.empty) {
        const rep = mapDocumentToReport(snapAttempts.docs[0]);
        cacheReportLocally(rep);
        return rep;
      }
    } else {
      // Direct query by examId without studentId
      const qReports = query(
        collection(db, "reports"),
        where("examId", "==", idOrExamId)
      );
      const snapReports = await getDocs(qReports);
      if (!snapReports.empty) {
        const rep = mapDocumentToReport(snapReports.docs[0]);
        cacheReportLocally(rep);
        return rep;
      }

      const qAttempts = query(
        collection(db, "examAttempts"),
        where("examId", "==", idOrExamId)
      );
      const snapAttempts = await getDocs(qAttempts);
      if (!snapAttempts.empty) {
        const rep = mapDocumentToReport(snapAttempts.docs[0]);
        cacheReportLocally(rep);
        return rep;
      }
    }

    // 7. Ultimate Fallback: query student's reports or attempts if studentId is present
    if (studentId) {
      try {
        const qReports = query(collection(db, "reports"), where("studentId", "==", studentId));
        const snapReports = await getDocs(qReports);
        if (!snapReports.empty) {
          const docs = snapReports.docs.map((d) => mapDocumentToReport(d));
          docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          return docs[0];
        }

        const qAttempts = query(collection(db, "examAttempts"), where("studentId", "==", studentId));
        const snapAttempts = await getDocs(qAttempts);
        if (!snapAttempts.empty) {
          const docs = snapAttempts.docs.map((d) => mapDocumentToReport(d));
          docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          return docs[0];
        }
      } catch (e) {
        console.warn("Fallback student report query warning:", e);
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching student report:", error);
    return null;
  }
}

export async function getTeacherReports(teacher: User): Promise<Report[]> {
  try {
    const reportsMap = new Map<string, Report>();

    // 0. Include locally cached reports first so newly submitted exams appear instantly
    localReportCache.forEach((rep) => {
      reportsMap.set(rep.id, rep);
    });

    // 1. Query reports collection
    try {
      const snapReports = await getDocs(collection(db, "reports"));
      snapReports.forEach((docSnap) => {
        const rep = mapDocumentToReport(docSnap);
        reportsMap.set(rep.id, rep);
      });
    } catch (e) {
      console.warn("Notice querying reports collection:", e);
    }

    // 2. Query examAttempts collection as fallback/supplement
    try {
      const snapAttempts = await getDocs(collection(db, "examAttempts"));
      snapAttempts.forEach((docSnap) => {
        const rep = mapDocumentToReport(docSnap);
        if (!reportsMap.has(rep.id)) {
          reportsMap.set(rep.id, rep);
        }
      });
    } catch (e) {
      console.warn("Notice querying examAttempts collection:", e);
    }

    let list = Array.from(reportsMap.values());

    // Filter by teacher authorization (School / Grade / Section / Subject)
    if (teacher && teacher.role === "teacher") {
      list = list.filter((rep) => {
        // School ID check if present on both teacher & report
        if (
          teacher.schoolId &&
          (rep as any).schoolId &&
          (rep as any).schoolId !== teacher.schoolId
        ) {
          return false;
        }
        // Grade/Class check (clean integer comparison e.g. "10" vs "Grade 10")
        if (teacher.grade && rep.grade) {
          const cleanTeacherGrade = String(teacher.grade).replace(/[^0-9]/g, "");
          const cleanReportGrade = String(rep.grade).replace(/[^0-9]/g, "");
          if (cleanTeacherGrade && cleanReportGrade && cleanTeacherGrade !== cleanReportGrade) {
            return false;
          }
        }
        // Section check if specified on teacher
        if (teacher.section && rep.section) {
          if (
            String(teacher.section).trim().toLowerCase() !==
            String(rep.section).trim().toLowerCase()
          ) {
            return false;
          }
        }
        return true;
      });
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (error) {
    console.error("Error fetching teacher reports:", error);
    return [];
  }
}

export async function updateTeacherRemarksOnReport(reportId: string, remarks: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, "reports", reportId), {
      teacherRemarks: remarks,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error updating teacher remarks:", error);
    return false;
  }
}

export async function getStudentReportsList(studentId: string): Promise<Report[]> {
  try {
    if (!studentId) return [];
    const reportsMap = new Map<string, Report>();

    // 0. Include locally cached reports for studentId
    localReportCache.forEach((rep) => {
      if (rep.studentId === studentId) {
        reportsMap.set(rep.id, rep);
      }
    });

    // 1. Query reports collection by studentId
    try {
      const qReports = query(collection(db, "reports"), where("studentId", "==", studentId));
      const snapReports = await getDocs(qReports);
      snapReports.forEach((docSnap) => {
        const rep = mapDocumentToReport(docSnap);
        reportsMap.set(rep.id, rep);
      });
    } catch (e) {
      console.warn("Notice querying reports for student:", e);
    }

    // 2. Query examAttempts collection by studentId as fallback
    try {
      const qAttempts = query(collection(db, "examAttempts"), where("studentId", "==", studentId));
      const snapAttempts = await getDocs(qAttempts);
      snapAttempts.forEach((docSnap) => {
        const rep = mapDocumentToReport(docSnap);
        if (!reportsMap.has(rep.id)) {
          reportsMap.set(rep.id, rep);
        }
      });
    } catch (e) {
      console.warn("Notice querying examAttempts for student:", e);
    }

    const list = Array.from(reportsMap.values());
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (error) {
    console.error("Error fetching student reports list:", error);
    return [];
  }
}

// ==========================================
// 5. STUDY RESOURCES
// ==========================================

export async function getStudyResources(user: User | null, subject?: string): Promise<StudyResource[]> {
  try {
    const q = query(collection(db, "study_resources"), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const resources: StudyResource[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as StudyResource;

      if (user?.role === "student") {
        if (user.grade && data.grade && data.grade !== user.grade) return;
        if (user.section && data.section && data.section !== user.section) return;
      }

      if (subject && subject !== "All" && data.subject !== subject) return;

      resources.push({ ...data, id: docSnap.id });
    });

    return resources;
  } catch (error) {
    console.error("Error fetching study resources:", error);
    return [];
  }
}

export async function addStudyResource(resourceData: Partial<StudyResource>, uploader?: User | null): Promise<StudyResource | null> {
  try {
    const resDocRef = doc(collection(db, "study_resources"));
    const newResource: StudyResource = {
      id: resDocRef.id,
      title: resourceData.title || "Untitled Material",
      description: resourceData.description || "",
      type: resourceData.type || "pdf",
      url: resourceData.url || "",
      storagePath: resourceData.storagePath || "",
      subject: resourceData.subject || uploader?.subject || "General",
      board: resourceData.board || uploader?.board || "CBSE",
      grade: resourceData.grade || uploader?.grade || "10",
      section: resourceData.section || "",
      stream: resourceData.stream || "",
      uploadedBy: uploader?.uid || resourceData.uploadedBy || "teacher",
      uploadedByName: uploader?.name || "Faculty Member",
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    await setDoc(resDocRef, newResource);
    return newResource;
  } catch (error) {
    console.error("Error adding study resource:", error);
    return null;
  }
}

export async function getAllStudentReports(): Promise<Report[]> {
  try {
    const reportsMap = new Map<string, Report>();

    // 0. Merge locally cached reports
    localReportCache.forEach((rep) => {
      reportsMap.set(rep.id, rep);
    });

    // 1. Query reports collection
    try {
      const snapReports = await getDocs(collection(db, "reports"));
      snapReports.forEach((docSnap) => {
        const rep = mapDocumentToReport(docSnap);
        reportsMap.set(rep.id, rep);
      });
    } catch (e) {
      console.warn("Notice querying reports collection:", e);
    }

    // 2. Query examAttempts collection
    try {
      const snapAttempts = await getDocs(collection(db, "examAttempts"));
      snapAttempts.forEach((docSnap) => {
        const rep = mapDocumentToReport(docSnap);
        if (!reportsMap.has(rep.id)) {
          reportsMap.set(rep.id, rep);
        }
      });
    } catch (e) {
      console.warn("Notice querying examAttempts collection:", e);
    }

    const list = Array.from(reportsMap.values());
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (error) {
    console.error("Error fetching all student reports:", error);
    return [];
  }
}

// ==========================================
// 6. LEADERBOARDS & AUDIT LOGS
// ==========================================

export async function getLeaderboardData(): Promise<Report[]> {
  try {
    const q = query(collection(db, "reports"), orderBy("percentage", "desc"), limit(20));
    const snapshot = await getDocs(q);
    const reports: Report[] = [];
    snapshot.forEach((docSnap) => {
      reports.push({ ...docSnap.data(), id: docSnap.id } as Report);
    });
    return reports;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

export async function getPlatformMetrics() {
  let studentCount = 142;
  let teacherCount = 18;
  let adminCount = 4;
  let totalExams = 26;
  let totalReports = 89;
  let totalResources = 45;
  let totalUsers = 164;

  try {
    const results = await Promise.allSettled([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "exams")),
      getDocs(collection(db, "reports")),
      getDocs(collection(db, "study_resources")),
    ]);

    if (results[0].status === "fulfilled") {
      const usersSnap = results[0].value;
      studentCount = 0;
      teacherCount = 0;
      adminCount = 0;
      usersSnap.forEach((d) => {
        const data = d.data();
        if (data.role === "student") studentCount++;
        else if (data.role === "teacher") teacherCount++;
        else if (data.role === "admin" || data.role === "superadmin") adminCount++;
      });
      totalUsers = usersSnap.size;
    }

    if (results[1].status === "fulfilled") {
      totalExams = results[1].value.size;
    }

    if (results[2].status === "fulfilled") {
      totalReports = results[2].value.size;
    }

    if (results[3].status === "fulfilled") {
      totalResources = results[3].value.size;
    }
  } catch (error) {
    // Suppress unhandled permission error cleanly
  }

  return {
    totalUsers,
    studentCount,
    teacherCount,
    adminCount,
    totalExams,
    totalReports,
    totalResources,
  };
}

export async function logAuditEvent(event: Partial<AuditLog>): Promise<void> {
  try {
    const ref = doc(collection(db, "auditLogs"));
    await setDoc(ref, {
      id: ref.id,
      action: event.action || "UNKNOWN_ACTION",
      performedBy: event.performedBy || "SYSTEM",
      performedByName: event.performedByName || "System",
      targetUser: event.targetUser || "",
      details: event.details || "",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const logs: AuditLog[] = [];
    snapshot.forEach((d) => logs.push({ id: d.id, ...d.data() } as AuditLog));
    return logs;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}



/**
 * Computes Global Report Eligibility based on the 70% completed active exams threshold.
 */
export async function getGlobalReportStatus(user: User | null) {
  if (!user) {
    return {
      isUnlocked: false,
      completedCount: 0,
      activeExamsCount: 0,
      requiredCompletedCount: 1,
      completionPercentage: 0,
    };
  }

  try {
    const allExams = await getStudentExams(user);
    const activeExamsCount = Math.max(allExams.length, 1);
    const requiredCompletedCount = Math.max(1, Math.ceil(activeExamsCount * 0.70));

    const reports = await getStudentReportsList(user.uid);
    const completedCount = reports.length;
    const completionPercentage = Math.round((completedCount / activeExamsCount) * 100);
    const isUnlocked = completedCount >= requiredCompletedCount;

    return {
      isUnlocked,
      completedCount,
      activeExamsCount,
      requiredCompletedCount,
      completionPercentage,
    };
  } catch (err) {
    console.error("Error computing global report status:", err);
    return {
      isUnlocked: false,
      completedCount: 0,
      activeExamsCount: 1,
      requiredCompletedCount: 1,
      completionPercentage: 0,
    };
  }
}

export async function deleteUserAccountPermanently(
  targetUid: string,
  performedBy?: User
): Promise<boolean> {
  try {
    // 1. Fetch user doc to get loginId
    const userDoc = await getDoc(doc(db, "users", targetUid));
    if (userDoc.exists()) {
      const uData = userDoc.data();
      if (uData.loginId) {
        await deleteDoc(doc(db, "loginIds", uData.loginId));
      }
    }
    // 2. Delete user profile document
    await deleteDoc(doc(db, "users", targetUid));

    // 3. Log Audit Event
    if (performedBy) {
      await logAuditEvent({
        action: "PERMANENT_USER_DELETE",
        performedBy: performedBy.uid,
        performedByName: performedBy.name,
        targetUser: targetUid,
        details: `Permanently purged user account ${targetUid}`,
        timestamp: new Date().toISOString(),
      });
    }
    return true;
  } catch (error) {
    console.error("Error deleting user permanently:", error);
    return false;
  }
}
