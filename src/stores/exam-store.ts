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
  clearAnswer: (questionId: string) => void;
  toggleMarkForReview: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  tickTimer: () => void;
  recordQuestionTime: (questionId: string, seconds: number) => void;
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
    const rawMins = exam?.durationMinutes;
    const parsedMins = typeof rawMins === "number" ? rawMins : parseInt(String(rawMins || "60"), 10);
    const durationSeconds = !isNaN(parsedMins) && parsedMins > 0 ? parsedMins * 60 : 3600;

    let initSeconds = durationSeconds;
    if (attempt && (attempt as any).remainingSeconds !== undefined && (attempt as any).remainingSeconds !== null) {
      const draftSecs = Number((attempt as any).remainingSeconds);
      if (!isNaN(draftSecs) && draftSecs > 0) {
        initSeconds = draftSecs;
      }
    }

    set({
      currentExam: exam,
      questions,
      currentQuestionIndex: 0,
      answers: attempt?.answers || {},
      markedForReview: attempt?.markedForReview || [],
      revisitedQuestions: attempt?.revisitedQuestions || [],
      timeSpentPerQuestion: attempt?.timeSpentPerQuestion || {},
      remainingSeconds: initSeconds,
      isExamActive: true,
      isSubmitting: false,
    });
  },

  selectAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },

  clearAnswer: (questionId) => {
    set((state) => {
      const updated = { ...state.answers };
      delete updated[questionId];
      return { answers: updated };
    });
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

  recordQuestionTime: (questionId, seconds) => {
    set((state) => ({
      timeSpentPerQuestion: {
        ...state.timeSpentPerQuestion,
        [questionId]: (state.timeSpentPerQuestion[questionId] || 0) + seconds,
      },
    }));
  },

  tickTimer: () => {
    const { remainingSeconds, isExamActive, questions, currentQuestionIndex } = get();
    if (!isExamActive) return;

    // Track 1 second for active question
    const currentQId = questions[currentQuestionIndex]?.id;
    if (currentQId) {
      get().recordQuestionTime(currentQId, 1);
    }

    if (isNaN(remainingSeconds) || remainingSeconds <= 1) {
      set({ remainingSeconds: 0 });
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
