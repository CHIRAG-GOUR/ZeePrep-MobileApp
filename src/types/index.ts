export type UserRole = "superadmin" | "admin" | "teacher" | "student";
export type AccountStatus = "active" | "pending" | "disabled" | "rejected";

export interface User {
  uid: string;
  loginId?: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  approvalStatus?: "pending" | "approved" | "rejected";
  emailVerified?: boolean;
  avatarUrl?: string;
  phone?: string;
  schoolName?: string;
  schoolId?: string;
  board?: string;
  academicSession?: string;
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

export type QuestionLevel = "level1" | "level2" | "level3";
export type QuestionType = "mcq" | "numerical" | "assertion-reason" | "subjective";

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  level: QuestionLevel;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  subject: string;
  board?: string;
  grade?: string;
  chapter?: string;
  topic?: string;
  marks: number;
  negativeMarks?: number;
  imageUrl?: string;
  createdBy: string; // Teacher UID
  isTeacherAuthority?: boolean; // Teacher uploaded questions cannot be silently modified by AI
  version?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ExamBlueprint {
  subject: string;
  grade: string;
  section?: string;
  stream?: string;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalMarks: number;
}

export type MaxAttemptsOption = 1 | 2 | 3 | 5 | 10 | "unlimited";

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject: string;
  board?: string;
  grade: string;
  section?: string;
  stream?: string;
  academicSession?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  passingPercentage?: number;
  negativeMarkingEnabled?: boolean;
  maxAttempts?: MaxAttemptsOption;
  instructions?: string[];
  questionIds: string[];
  questions?: Question[];
  status: "draft" | "published" | "active" | "archived";
  startTime?: any;
  endTime?: any;
  createdBy: string;
  createdByName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: "not_started" | "in_progress" | "submitted" | "processed";
  attemptNumber?: number;
  maxAttempts?: MaxAttemptsOption;
  answers: Record<string, string | number>;
  markedForReview: string[];
  revisitedQuestions: string[];
  timeSpentPerQuestion: Record<string, number>;
  totalTimeSpentSeconds?: number;
  score?: number;
  percentage?: number;
  passed?: boolean;
  startedAt?: any;
  submittedAt?: any;
  syncedAt?: any;
  questions?: Question[];
}

export interface DetailedQuestionAnalysis {
  questionId: string;
  questionNumber?: number;
  questionText: string;
  correctAnswer: string | number;
  studentAnswer: string | number;
  isCorrect: boolean;
  isUnanswered?: boolean;
  marks?: number;
  awardedMarks?: number;
  timeSpentSeconds: number;
  chapter?: string;
  topic?: string;
  level?: QuestionLevel;
}

export interface Report {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  attemptNumber?: number;
  maxAttempts?: MaxAttemptsOption;
  board?: string;
  grade?: string;
  section?: string;
  stream?: string;
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
  detailedAnalysis?: DetailedQuestionAnalysis[];
  mostTimeSpentQuestion?: {
    questionId: string;
    questionNumber: number;
    questionText: string;
    topic: string;
    timeSpentSeconds: number;
  };
  mostTimeSpentTopic?: string;
  aiInsight?: any;
  strongTopics?: string[];
  weakTopics?: string[];
  aiAnalysisText?: string;
  teacherRemarks?: string;
  createdAt?: any;
}

export type ResourceType = "pdf" | "docx" | "doc" | "word" | "pptx" | "excel" | "txt" | "text" | "image" | "video" | "audio" | "link";

export interface StudyResource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  storagePath?: string;
  subject: string;
  board?: string;
  grade: string;
  section?: string;
  stream?: string;
  uploadedBy: string;
  uploadedByName?: string;
  downloadCount?: number;
  createdAt?: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "exam_assigned" | "report_ready" | "resource_uploaded" | "teacher_remark" | "teacher_approval_request" | "admin_alert";
  recipientId: string;
  recipientRole?: UserRole;
  read: boolean;
  createdAt?: any;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  targetUser?: string;
  details?: string;
  timestamp: any;
}

export interface AcademicSession {
  id: string;
  name: string; // e.g. "2026-2027"
  isCurrent: boolean;
}

export interface ClassGrade {
  id: string;
  name: string; // e.g. "Grade 10"
  gradeNumber: string; // "10"
  board: string;
  sections: string[]; // ["A", "B", "C"]
  streams?: string[]; // ["Science", "Commerce", "Arts"]
}
