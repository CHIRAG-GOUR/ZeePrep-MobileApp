import { create } from "zustand";
import type { Exam, Question, ExamAttempt } from "../types";

interface ExamEngineState {
  currentExam: Exam | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string | number>;
  markedForReview: string[];
  revisitedQuestions: string[];
  timeSpentPerQuestion: Record<string, number>;
  remainingSeconds: number;
  isExamActive: boolean;
  isSubmitting: boolean;

  // Actions
  startExam: (exam: Exam, questions: Question[], attempt?: ExamAttempt) => void;
  selectAnswer: (questionId: string, answer: string | number) => void;
  toggleMarkForReview: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  tickTimer: () => void;
  submitExam: () => Promise<ExamAttempt | null>;
  resetExamEngine: () => void;
}

export const useExamStore = create<ExamEngineState>((set, get) => ({
  currentExam: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  markedForReview: [],
  revisitedQuestions: [],
  timeSpentPerQuestion: {},
  remainingSeconds: 0,
  isExamActive: false,
  isSubmitting: false,

  startExam: (exam, questions, attempt) => {
    set({
      currentExam: exam,
      questions,
      currentQuestionIndex: 0,
      answers: attempt?.answers || {},
      markedForReview: attempt?.markedForReview || [],
      revisitedQuestions: attempt?.revisitedQuestions || [],
      timeSpentPerQuestion: attempt?.timeSpentPerQuestion || {},
      remainingSeconds: exam.durationMinutes * 60,
      isExamActive: true,
      isSubmitting: false,
    });
  },

  selectAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },

  toggleMarkForReview: (questionId) => {
    set((state) => {
      const exists = state.markedForReview.includes(questionId);
      return {
        markedForReview: exists
          ? state.markedForReview.filter((id) => id !== questionId)
          : [...state.markedForReview, questionId],
      };
    });
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions, revisitedQuestions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      const currentQId = questions[currentQuestionIndex]?.id;
      const updatedRevisited = currentQId && !revisitedQuestions.includes(currentQId)
        ? [...revisitedQuestions, currentQId]
        : revisitedQuestions;

      set({
        currentQuestionIndex: nextIdx,
        revisitedQuestions: updatedRevisited,
      });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  goToQuestion: (index) => {
    const { questions, revisitedQuestions, currentQuestionIndex } = get();
    if (index >= 0 && index < questions.length) {
      const currentQId = questions[currentQuestionIndex]?.id;
      const updatedRevisited = currentQId && !revisitedQuestions.includes(currentQId)
        ? [...revisitedQuestions, currentQId]
        : revisitedQuestions;

      set({
        currentQuestionIndex: index,
        revisitedQuestions: updatedRevisited,
      });
    }
  },

  tickTimer: () => {
    const { remainingSeconds, isExamActive } = get();
    if (!isExamActive) return;
    if (remainingSeconds <= 1) {
      get().submitExam();
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  submitExam: async () => {
    set({ isSubmitting: true });
    const { currentExam, answers, markedForReview, revisitedQuestions, timeSpentPerQuestion } = get();
    if (!currentExam) return null;

    // Simulated Attempt Submission Object
    const attempt: ExamAttempt = {
      id: `attempt_${currentExam.id}_${Date.now()}`,
      examId: currentExam.id,
      studentId: "student_uid",
      studentName: "Student",
      studentEmail: "student@zeeprep.com",
      status: "submitted",
      answers,
      markedForReview,
      revisitedQuestions,
      timeSpentPerQuestion,
      submittedAt: new Date().toISOString(),
    };

    set({ isExamActive: false, isSubmitting: false });
    return attempt;
  },

  resetExamEngine: () => {
    set({
      currentExam: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: [],
      revisitedQuestions: [],
      timeSpentPerQuestion: {},
      remainingSeconds: 0,
      isExamActive: false,
      isSubmitting: false,
    });
  },
}));
