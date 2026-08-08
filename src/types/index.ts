export type UserRole = "superadmin" | "admin" | "teacher" | "student";

export interface User {
  uid: string;
  loginId?: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "pending" | "disabled" | "rejected";
  approvalStatus?: "pending" | "approved" | "rejected";
  emailVerified?: boolean;
  avatarUrl?: string;
  phone?: string;
  schoolName?: string;
  board?: string;
  grade?: string;
  section?: string;
  stream?: string;
  classIds?: string[];
  assignedSections?: string[];
  subjectIds?: string[];
  subject?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Question {
  id: string;
  text: string;
  type: "mcq" | "numerical" | "assertion-reason" | "subjective";
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  subject?: string;
  chapter?: string;
  topic?: string;
  marks: number;
  negativeMarks?: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  section?: string;
  stream?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questionIds: string[];
  questions?: Question[];
  status: "draft" | "published" | "active" | "archived";
  startTime?: any;
  endTime?: any;
  createdBy: string;
  createdAt?: any;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: "not_started" | "in_progress" | "submitted" | "processed";
  answers: Record<string, string | number>;
  markedForReview: string[];
  revisitedQuestions: string[];
  timeSpentPerQuestion: Record<string, number>;
  score?: number;
  percentage?: number;
  passed?: boolean;
  startedAt?: any;
  submittedAt?: any;
  syncedAt?: any;
}

export interface Report {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  timeSpentSeconds: number;
  accuracy: number;
  createdAt?: any;
}

export interface StudyResource {
  id: string;
  title: string;
  description?: string;
  type: "pdf" | "docx" | "pptx" | "excel" | "txt" | "image" | "video" | "audio" | "link";
  url: string;
  subject: string;
  grade: string;
  section?: string;
  stream?: string;
  uploadedBy: string;
  createdAt?: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "exam_assigned" | "report_ready" | "resource_uploaded" | "teacher_remark";
  read: boolean;
  recipientId: string;
  createdAt?: any;
}
