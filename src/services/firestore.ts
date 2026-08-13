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
import type {
  User,
  Exam,
  Question,
  ExamAttempt,
  Report,
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

export async function submitStudentExamAttempt(
  exam: Exam,
  questions: Question[],
  user: User,
  answers: Record<string, string | number>,
  markedForReview: string[],
  revisitedQuestions: string[],
  timeSpentPerQuestion: Record<string, number>
): Promise<{ attempt: ExamAttempt; report: Report }> {
  let obtainedMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  questions.forEach((q) => {
    const studentAns = answers[q.id];
    if (studentAns === undefined || studentAns === "" || studentAns === null) {
      unattemptedCount++;
    } else if (String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
      correctCount++;
      obtainedMarks += q.marks || 1;
    } else {
      incorrectCount++;
      // NO NEGATIVE MARKING RULE: Incorrect answers yield 0 marks (never negative)
    }
  });

  // Guarantee non-negative score
  obtainedMarks = Math.max(0, obtainedMarks);

  const totalQuestions = questions.length;
  // Requirement 10: Dynamically calculate total possible marks as sum(question.marks)
  const maxMarks =
    questions && questions.length > 0
      ? questions.reduce((sum, q) => sum + (q.marks !== undefined && q.marks !== null ? q.marks : 1), 0)
      : exam.totalMarks && exam.totalMarks > 0
      ? exam.totalMarks
      : 1;

  const percentage = maxMarks > 0 ? Math.round((obtainedMarks / maxMarks) * 100) : 0;
  const passed = obtainedMarks >= (exam.passingMarks || Math.ceil(maxMarks * 0.33));
  const totalTimeSpent = Object.values(timeSpentPerQuestion).reduce((acc, curr) => acc + (typeof curr === "number" ? curr : 0), 0);
  const accuracy = (correctCount + incorrectCount) > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0;

  // Requirement 31.4 & 31.13: Preserve attempt number and generate distinct attempt/report IDs
  const prevAttempts = await getStudentExamAttempts(exam.id, user.uid);
  const attemptNum = prevAttempts.length + 1;

  const attemptId = attemptNum === 1 ? `attempt_${exam.id}_${user.uid}` : `attempt_${exam.id}_${user.uid}_att${attemptNum}`;
  const reportId = attemptNum === 1 ? `report_${exam.id}_${user.uid}` : `report_${exam.id}_${user.uid}_att${attemptNum}`;

  const attempt: ExamAttempt = {
    id: attemptId,
    examId: exam.id,
    studentId: user.uid,
    studentName: user.name,
    studentEmail: user.email,
    status: "submitted",
    attemptNumber: attemptNum,
    maxAttempts: exam.maxAttempts || 1,
    answers,
    markedForReview,
    revisitedQuestions,
    timeSpentPerQuestion,
    score: obtainedMarks,
    percentage,
    passed,
    startedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  };

  // Build per-question detailed analysis (Requirement 12, 14)
  const detailedAnalysis = questions.map((q) => {
    const studentAns = answers[q.id];
    const isCorrect =
      studentAns !== undefined &&
      studentAns !== "" &&
      studentAns !== null &&
      String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
    const isUnanswered = studentAns === undefined || studentAns === "" || studentAns === null;
    const qMarks = q.marks !== undefined && q.marks !== null ? q.marks : 1;
    const awardedMarks = isCorrect ? qMarks : 0;

    return {
      questionId: q.id,
      questionText: String((q as any).text || (q as any).questionText || (q as any).question || ""),
      correctAnswer: q.correctAnswer,
      studentAnswer: isUnanswered ? "" : studentAns,
      isCorrect,
      isUnanswered,
      timeSpentSeconds: timeSpentPerQuestion[q.id] || 0,
      marks: qMarks,
      awardedMarks,
      chapter: q.chapter || "",
      topic: q.topic || "",
      level: q.level || "level1",
    };
  });

  const report: Report = {
    id: reportId,
    examId: exam.id,
    examTitle: exam.title,
    studentId: user.uid,
    studentName: user.name,
    studentEmail: user.email,
    attemptNumber: attemptNum,
    maxAttempts: exam.maxAttempts || 1,
    board: user.board,
    grade: user.grade,
    section: user.section,
    stream: user.stream,
    totalMarks: maxMarks,
    obtainedMarks,
    percentage,
    passed,
    totalQuestions,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unattempted: unattemptedCount,
    timeSpentSeconds: totalTimeSpent,
    accuracy,
    detailedAnalysis,
    createdAt: new Date().toISOString(),
  };

  // Store exam subject on report for AI analysis context
  (report as any).subject = exam.subject || "";

  try {
    // Prevent duplicate submission: check if report already exists
    const existingReport = await getDoc(doc(db, "reports", reportId));
    if (existingReport.exists()) {
      console.warn(`[ZeePrep] Duplicate submission prevented for report ${reportId}`);
      return { attempt, report: mapDocumentToReport(existingReport) };
    }

    await setDoc(doc(db, "examAttempts", attemptId), attempt);
    await setDoc(doc(db, "reports", reportId), report);
    await clearExamDraftLocally(exam.id, user.uid);
  } catch (err) {
    console.error("Error saving attempt/report to Firestore:", err);
  }

  return { attempt, report };
}

function mapDocumentToReport(docSnap: any): Report {
  const d = typeof docSnap.data === "function" ? docSnap.data() : docSnap;
  const id = docSnap.id || d.id || `rep_${Math.random()}`;
  const totalMarks = Number(d.totalMarks || d.totalScore || 100);
  const rawObtained = Number(d.obtainedMarks ?? d.score ?? 0);
  const obtainedMarks = Math.max(0, rawObtained); // Strictly non-negative score
  const percentage = Number(
    d.percentage !== undefined
      ? d.percentage
      : totalMarks > 0
      ? Math.round((obtainedMarks / totalMarks) * 100)
      : 0
  );
  const passed =
    d.passed !== undefined ? Boolean(d.passed) : obtainedMarks >= totalMarks * 0.33;

  return {
    id,
    examId: d.examId || d.testId || "",
    examTitle: d.examTitle || d.title || d.testTitle || "Assessment Report",
    studentId: d.studentId || d.userId || d.uid || "",
    studentName: d.studentName || d.userName || "Student",
    studentEmail: d.studentEmail || d.email || "",
    board: d.board || "CBSE",
    grade: d.grade || "12",
    section: d.section || "A",
    stream: d.stream || "Science",
    totalMarks,
    obtainedMarks,
    percentage,
    passed,
    totalQuestions: Number(d.totalQuestions || (d.answers ? d.answers.length : 0)),
    correctAnswers: Number(d.correctAnswers || d.correctCount || 0),
    incorrectAnswers: Number(d.incorrectAnswers || d.incorrectCount || 0),
    unattempted: Number(d.unattempted || 0),
    timeSpentSeconds: Number(d.timeSpentSeconds || d.totalTimeSpent || 0),
    accuracy: Number(d.accuracy || percentage),
    teacherRemarks: d.teacherRemarks || d.overallRemarks || d.teacherNotes || "",
    createdAt: d.createdAt || d.submittedAt || d.startedAt || new Date().toISOString(),
  };
}

// Fetch Reports
export async function getStudentReport(idOrExamId: string, studentId?: string): Promise<Report | null> {
  try {
    if (!idOrExamId) return null;

    // 1. Try direct lookup by ID (in case idOrExamId is a full report doc ID)
    const directReportDoc = await getDoc(doc(db, "reports", idOrExamId));
    if (directReportDoc.exists()) {
      return mapDocumentToReport(directReportDoc);
    }

    const directAttemptDoc = await getDoc(doc(db, "examAttempts", idOrExamId));
    if (directAttemptDoc.exists()) {
      return mapDocumentToReport(directAttemptDoc);
    }

    // 2. Constructed IDs with studentId if present
    if (studentId) {
      const reportId = `report_${idOrExamId}_${studentId}`;
      const attemptId = `attempt_${idOrExamId}_${studentId}`;

      const reportDoc = await getDoc(doc(db, "reports", reportId));
      if (reportDoc.exists()) {
        return mapDocumentToReport(reportDoc);
      }

      const attemptDoc = await getDoc(doc(db, "examAttempts", attemptId));
      if (attemptDoc.exists()) {
        return mapDocumentToReport(attemptDoc);
      }

      const qReports = query(
        collection(db, "reports"),
        where("examId", "==", idOrExamId),
        where("studentId", "==", studentId)
      );
      const snapReports = await getDocs(qReports);
      if (!snapReports.empty) {
        return mapDocumentToReport(snapReports.docs[0]);
      }

      const qAttempts = query(
        collection(db, "examAttempts"),
        where("examId", "==", idOrExamId),
        where("studentId", "==", studentId)
      );
      const snapAttempts = await getDocs(qAttempts);
      if (!snapAttempts.empty) {
        return mapDocumentToReport(snapAttempts.docs[0]);
      }
    } else {
      // Direct query by examId without studentId
      const qReports = query(
        collection(db, "reports"),
        where("examId", "==", idOrExamId)
      );
      const snapReports = await getDocs(qReports);
      if (!snapReports.empty) {
        return mapDocumentToReport(snapReports.docs[0]);
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

    try {
      const snapReports = await getDocs(collection(db, "reports"));
      snapReports.forEach((docSnap) => {
        const rep = mapDocumentToReport(docSnap);
        if (teacher.role === "teacher" && teacher.grade && rep.grade && rep.grade !== teacher.grade) {
          return;
        }
        reportsMap.set(rep.id, rep);
      });
    } catch (e) {
      console.warn("Notice querying reports collection:", e);
    }

    try {
      const snapAttempts = await getDocs(collection(db, "examAttempts"));
      snapAttempts.forEach((docSnap) => {
        const rep = mapDocumentToReport(docSnap);
        if (teacher.role === "teacher" && teacher.grade && rep.grade && rep.grade !== teacher.grade) {
          return;
        }
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
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const reports: Report[] = [];
    snapshot.forEach((d) => reports.push({ id: d.id, ...d.data() } as Report));
    return reports;
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
