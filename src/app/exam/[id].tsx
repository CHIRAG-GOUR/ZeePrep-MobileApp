import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { useExamStore } from "../../stores/exam-store";
import { normalizeQuestionOption } from "../../utils/question-normalizer";
import {
  getExamDetails,
  submitStudentExamAttempt,
  saveExamDraftLocally,
  getExamDraftLocally,
} from "../../services/firestore";
import type { Question } from "../../types";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  WifiOff,
  RotateCcw,
  CheckCircle2,
  Trash2,
} from "lucide-react-native";

export default function ExamEngineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    currentExam,
    questions,
    currentQuestionIndex,
    answers,
    markedForReview,
    remainingSeconds,
    isExamActive,
    isSubmitting,
    startExam,
    selectAnswer,
    toggleMarkForReview,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    tickTimer,
    resetExamEngine,
  } = useExamStore();

  const [loading, setLoading] = useState(true);
  const [questionTimeMap, setQuestionTimeMap] = useState<Record<string, number>>({});
  const [draftRestored, setDraftRestored] = useState(false);

  // Time tracking ref per question
  const currentQStartTime = useRef<number>(Date.now());

  // Initialize Exam Data & Restore Draft if exists
  useEffect(() => {
    async function initExam() {
      if (!id || !user) return;
      setLoading(true);

      const { exam, questions: fetchedQuestions } = await getExamDetails(id as string);

      if (exam && fetchedQuestions.length > 0) {
        // Check for local saved draft for resilience
        const draft = await getExamDraftLocally(exam.id, user.uid);

        if (draft && draft.answers) {
          startExam(exam, fetchedQuestions, {
            id: `draft_${exam.id}`,
            examId: exam.id,
            studentId: user.uid,
            studentName: user.name,
            studentEmail: user.email,
            status: "in_progress",
            answers: draft.answers,
            markedForReview: draft.markedForReview || [],
            revisitedQuestions: draft.revisitedQuestions || [],
            timeSpentPerQuestion: draft.timeSpentPerQuestion || {},
          });
          setQuestionTimeMap(draft.timeSpentPerQuestion || {});
          setDraftRestored(true);
        } else {
          startExam(exam, fetchedQuestions);
        }
      } else {
        Alert.alert("Exam Unavailable", "Could not load exam details or questions.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
      setLoading(false);
    }

    initExam();

    return () => {
      resetExamEngine();
    };
  }, [id, user]);

  // Countdown Timer & Auto-Save Draft
  useEffect(() => {
    if (!isExamActive) return;

    const interval = setInterval(() => {
      tickTimer();

      // Track time spent on active question
      const currentQId = questions[currentQuestionIndex]?.id;
      if (currentQId) {
        setQuestionTimeMap((prev) => ({
          ...prev,
          [currentQId]: (prev[currentQId] || 0) + 1,
        }));
      }

      // Periodically persist draft to local storage
      if (currentExam && user) {
        saveExamDraftLocally(currentExam.id, user.uid, {
          answers,
          markedForReview,
          revisitedQuestions: [],
          timeSpentPerQuestion: questionTimeMap,
          remainingSeconds,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamActive, currentQuestionIndex, answers, markedForReview, remainingSeconds]);

  // Handle hardware back button during exam
  useEffect(() => {
    const onBackPress = () => {
      if (isExamActive) {
        Alert.alert(
          "Exit Examination?",
          "Your progress is automatically saved. Timer will continue running.",
          [
            { text: "Resume Exam", style: "cancel" },
            { text: "Exit to Dashboard", style: "destructive", onPress: () => router.back() },
          ]
        );
        return true;
      }
      return false;
    };

    const handler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => handler.remove();
  }, [isExamActive]);

  const handleSelectAnswer = (qId: string, answer: string | number) => {
    // Toggle answer: if same option clicked again, clear answer
    if (answers[qId] === answer) {
      const updatedAnswers = { ...answers };
      delete updatedAnswers[qId];
      useExamStore.setState({ answers: updatedAnswers });
    } else {
      selectAnswer(qId, answer);
    }

    // Persist draft immediately
    if (currentExam && user) {
      saveExamDraftLocally(currentExam.id, user.uid, {
        answers: useExamStore.getState().answers,
        markedForReview,
        revisitedQuestions: [],
        timeSpentPerQuestion: questionTimeMap,
        remainingSeconds,
      });
    }
  };

  const handleClearAnswer = (qId: string) => {
    const updatedAnswers = { ...answers };
    delete updatedAnswers[qId];
    useExamStore.setState({ answers: updatedAnswers });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const answeredCount = Object.keys(answers).length;
    const totalQ = questions.length;

    Alert.alert(
      "Confirm Submission",
      `Are you sure you want to submit?\n\nAnswered: ${answeredCount} of ${totalQ}\nUnanswered: ${totalQ - answeredCount}`,
      [
        { text: "Review Answers", style: "cancel" },
        {
          text: "Submit Exam",
          style: "default",
          onPress: async () => {
            if (!currentExam || !user) return;
            try {
              const { report } = await submitStudentExamAttempt(
                currentExam,
                questions,
                user,
                answers,
                markedForReview,
                [],
                questionTimeMap
              );
              router.replace(`/results/${currentExam.id}` as any);
            } catch (err) {
              console.error("Exam submission error:", err);
              Alert.alert("Network Issue", "Submission saved locally. Will sync when back online.");
            }
          },
        },
      ]
    );
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || !currentExam) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#818CF8" />
        <Text style={styles.loadingText}>Loading Exam Paper...</Text>
      </View>
    );
  }

  const currentQ: Question | undefined = questions[currentQuestionIndex];
  const isMarked = currentQ ? markedForReview.includes(currentQ.id) : false;
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  return (
    <View style={styles.container}>
      {/* Top Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ChevronLeft color="#0F172A" size={24} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.examTitleHeader} numberOfLines={1}>
            {currentExam.title}
          </Text>
          <Text style={styles.questionProgressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>

        {/* Live Timer Pill */}
        <View style={styles.timerChip}>
          <Clock size={16} color={remainingSeconds < 300 ? "#EF4444" : "#D97706"} />
          <Text style={[styles.timerText, remainingSeconds < 300 && styles.timerWarningText]}>
            {formatTimer(remainingSeconds)}
          </Text>
        </View>
      </View>

      {/* Draft Restored Banner */}
      {draftRestored ? (
        <View style={styles.draftBanner}>
          <CheckCircle2 size={14} color="#34D399" />
          <Text style={styles.draftBannerText}>Restored your previous saved attempt progress.</Text>
        </View>
      ) : null}

      {/* Horizontal Question Palette Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.paletteContainer}
      >
        {questions.map((q, idx) => {
          const isSelected = idx === currentQuestionIndex;
          const isAns = answers[q.id] !== undefined && answers[q.id] !== "";
          const isRev = markedForReview.includes(q.id);

          return (
            <TouchableOpacity
              key={q.id}
              style={[
                styles.paletteNode,
                isAns && styles.paletteNodeAnswered,
                isRev && styles.paletteNodeReview,
                isSelected && styles.paletteNodeSelected,
              ]}
              onPress={() => goToQuestion(idx)}
            >
              <Text style={[styles.paletteNodeText, isSelected && styles.paletteNodeTextSelected]}>
                {idx + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Question Content Body */}
      {currentQ ? (
        <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
          {/* Question Header Meta */}
          <View style={styles.questionMetaRow}>
            <View style={styles.marksChip}>
              <Text style={styles.marksText}>+{currentQ.marks || 1} Marks</Text>
            </View>

            <View style={styles.metaActionsRow}>
              {currentAnswer !== undefined ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => handleClearAnswer(currentQ.id)}
                >
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={styles.clearBtnText}>Clear Answer</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.reviewBtn, isMarked && styles.reviewBtnActive]}
                onPress={() => toggleMarkForReview(currentQ.id)}
              >
                <Bookmark size={15} color={isMarked ? "#FBBF24" : "#94A3B8"} />
                <Text style={[styles.reviewBtnText, isMarked && styles.reviewBtnTextActive]}>
                  {isMarked ? "Marked" : "Review"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>{currentQ.text}</Text>

          {/* MCQ Options */}
          {currentQ.options && currentQ.options.length > 0 ? (
            <View style={styles.optionsContainer}>
              {currentQ.options.map((rawOpt, optIdx) => {
                const optObj = normalizeQuestionOption(rawOpt, optIdx);
                const isOptionSelected = currentAnswer === rawOpt || currentAnswer === optObj.text || currentAnswer === optIdx;
                const optionLabel = optObj.id;

                return (
                  <TouchableOpacity
                    key={optIdx}
                    style={[styles.optionCard, isOptionSelected && styles.optionCardSelected]}
                    onPress={() => handleSelectAnswer(currentQ.id, optObj.text)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.optionRadio,
                        isOptionSelected && styles.optionRadioSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionRadioText,
                          isOptionSelected && styles.optionRadioTextSelected,
                        ]}
                      >
                        {optionLabel}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isOptionSelected && styles.optionTextSelected,
                      ]}
                    >
                      {optObj.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noOptionsText}>Numerical / Subjective entry required.</Text>
          )}
        </ScrollView>
      ) : null}

      {/* Footer Controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, currentQuestionIndex === 0 && styles.navBtnDisabled]}
          onPress={prevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft color={currentQuestionIndex === 0 ? "#475569" : "#F8FAFC"} size={20} />
          <Text
            style={[styles.navBtnText, currentQuestionIndex === 0 && styles.navBtnTextDisabled]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex < questions.length - 1 ? (
          <TouchableOpacity style={styles.navBtnPrimary} onPress={nextQuestion}>
            <Text style={styles.navBtnPrimaryText}>Next Question</Text>
            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send color="#FFFFFF" size={18} />
                <Text style={styles.submitBtnText}>Submit Exam</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  iconBtn: {
    padding: 6,
  },
  headerCenter: {
    alignItems: "center",
  },
  examTitleHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  questionProgressText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  timerText: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "700",
  },
  timerWarningText: {
    color: "#EF4444",
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16, 185, 129, 0.2)",
  },
  draftBannerText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
  },
  paletteContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  paletteNode: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  paletteNodeAnswered: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  paletteNodeReview: {
    borderColor: "#F59E0B",
    borderWidth: 2,
  },
  paletteNodeSelected: {
    borderColor: "#4F46E5",
    borderWidth: 2,
  },
  paletteNodeText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  paletteNodeTextSelected: {
    color: "#FFFFFF",
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  marksChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  marksText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "700",
  },
  metaActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewBtnActive: {},
  reviewBtnText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  reviewBtnTextActive: {
    color: "#D97706",
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  optionRadio: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionRadioSelected: {
    backgroundColor: "#4F46E5",
  },
  optionRadioText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  optionRadioTextSelected: {
    color: "#FFFFFF",
  },
  optionText: {
    flex: 1,
    color: "#334155",
    fontSize: 15,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#0F172A",
    fontWeight: "700",
  },
  noOptionsText: {
    color: "#64748B",
    fontStyle: "italic",
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  navBtnTextDisabled: {
    color: "#94A3B8",
  },
  navBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    height: 48,
    gap: 6,
  },
  navBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  submitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
