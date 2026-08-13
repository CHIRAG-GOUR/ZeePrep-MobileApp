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
  Modal,
  SafeAreaView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { useResponsive } from "../../hooks/useResponsive";
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
  CheckCircle2,
  Trash2,
  Grid,
  X,
  HelpCircle,
  AlertTriangle,
} from "lucide-react-native";

export function getQuestionText(q?: Question | any): string {
  if (!q) return "Untitled Question";
  const text = q.text || q.questionText || q.question || q.statement || q.title;
  if (text && String(text).trim().length > 0) {
    return String(text).trim();
  }
  return "Untitled Question";
}

export default function ExamEngineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const responsive = useResponsive();

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
    clearAnswer,
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
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [submittingModalVisible, setSubmittingModalVisible] = useState(false);
  const [submittingProgress, setSubmittingProgress] = useState(0);
  const [submittingStepText, setSubmittingStepText] = useState("Evaluating student telemetry...");

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
            remainingSeconds: draft.remainingSeconds,
          } as any);
          setQuestionTimeMap(draft.timeSpentPerQuestion || {});
          setDraftRestored(true);
        } else {
          startExam(exam, fetchedQuestions);
        }
      } else {
        Alert.alert("Error", "Could not load examination questions.");
        router.back();
      }
      setLoading(false);
    }

    initExam();

    return () => {
      resetExamEngine();
    };
  }, [id, user]);

  const autoSubmitRef = useRef(false);

  // Auto-submit handler for timer expiry (uses real Firestore submission)
  const handleAutoSubmit = async () => {
    if (autoSubmitRef.current || !currentExam || !user) return;
    autoSubmitRef.current = true;
    useExamStore.setState({ isSubmitting: true });

    setSubmittingModalVisible(true);
    setSubmittingProgress(15);
    setSubmittingStepText("Time's Up! Evaluating student responses & accuracy...");

    const progressInterval = setInterval(() => {
      setSubmittingProgress((prev) => {
        if (prev < 45) {
          setSubmittingStepText("Computing score & question-level correctness...");
          return prev + 10;
        } else if (prev < 75) {
          setSubmittingStepText("Synthesizing conceptual analysis...");
          return prev + 8;
        } else if (prev < 95) {
          setSubmittingStepText("Saving performance scorecard to cloud...");
          return prev + 5;
        }
        return prev;
      });
    }, 450);

    try {
      const { report } = await submitStudentExamAttempt(
        currentExam,
        questions,
        user,
        answers,
        markedForReview,
        [],
        useExamStore.getState().timeSpentPerQuestion || questionTimeMap
      );

      clearInterval(progressInterval);
      setSubmittingProgress(100);
      setSubmittingStepText("Report Generated! Loading Scorecard...");

      setTimeout(() => {
        useExamStore.setState({ isExamActive: false, isSubmitting: false });
        setSubmittingModalVisible(false);
        router.replace(`/results/${report.id}` as any);
      }, 1000);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Auto-submit error:", err);
      useExamStore.setState({ isSubmitting: false });
      setSubmittingModalVisible(false);
      autoSubmitRef.current = false;
      Alert.alert("Submission Error", "Auto-submission failed. Please try submitting manually.");
    }
  };

  // Countdown Timer & Auto-Save Draft
  useEffect(() => {
    if (!isExamActive) return;

    const interval = setInterval(() => {
      const { remainingSeconds: rs } = useExamStore.getState();
      if (rs <= 1) {
        clearInterval(interval);
        handleAutoSubmit();
        return;
      }
      tickTimer();

      // Periodically persist draft to local storage
      if (currentExam && user) {
        saveExamDraftLocally(currentExam.id, user.uid, {
          answers: useExamStore.getState().answers,
          markedForReview: useExamStore.getState().markedForReview,
          revisitedQuestions: [],
          timeSpentPerQuestion: useExamStore.getState().timeSpentPerQuestion,
          remainingSeconds: useExamStore.getState().remainingSeconds,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamActive]);

  const handleSelectAnswer = (qId: string, answer: string | number) => {
    if (answers[qId] === answer) {
      clearAnswer(qId);
    } else {
      selectAnswer(qId, answer);
    }

    // Persist draft immediately
    if (currentExam && user) {
      saveExamDraftLocally(currentExam.id, user.uid, {
        answers: useExamStore.getState().answers,
        markedForReview: useExamStore.getState().markedForReview,
        revisitedQuestions: [],
        timeSpentPerQuestion: useExamStore.getState().timeSpentPerQuestion,
        remainingSeconds: useExamStore.getState().remainingSeconds,
      });
    }
  };

  const handleClearAnswer = (qId: string) => {
    clearAnswer(qId);
  };

  const handleLeaveExam = () => {
    const maxAtt = currentExam?.maxAttempts || 1;
    let alertMsg = `Leaving this examination will save your draft. Make sure to complete and submit within the duration.`;
    if (maxAtt === 1) {
      alertMsg = `This is a 1-Attempt Examination. Leaving will save your current progress as a draft.`;
    } else {
      alertMsg = `Maximum Attempts: ${maxAtt}. Leaving this examination will save your draft. Make sure to complete and submit within the duration.`;
    }

    Alert.alert("Leave Examination?", alertMsg, [
      { text: "Continue Exam", style: "cancel" },
      {
        text: "Leave Exam",
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  };

  const executeFinalSubmission = async () => {
    if (!currentExam || !user || isSubmitting) return;
    setShowSubmitConfirmModal(false);

    setSubmittingModalVisible(true);
    setSubmittingProgress(10);
    setSubmittingStepText("Evaluating student telemetry & answer accuracy...");

    useExamStore.setState({ isSubmitting: true });

    const progressInterval = setInterval(() => {
      setSubmittingProgress((prev) => {
        if (prev < 40) {
          setSubmittingStepText("Evaluating student telemetry & answer accuracy...");
          return prev + 10;
        } else if (prev < 70) {
          setSubmittingStepText("Computing score & question-level correctness...");
          return prev + 8;
        } else if (prev < 92) {
          setSubmittingStepText("Saving performance scorecard to cloud...");
          return prev + 5;
        }
        return prev;
      });
    }, 400);

    try {
      const { report } = await submitStudentExamAttempt(
        currentExam,
        questions,
        user,
        answers,
        markedForReview,
        [],
        useExamStore.getState().timeSpentPerQuestion
      );

      clearInterval(progressInterval);
      setSubmittingProgress(100);
      setSubmittingStepText("Report Generated! Loading Scorecard...");

      setTimeout(() => {
        useExamStore.setState({ isExamActive: false, isSubmitting: false });
        setSubmittingModalVisible(false);
        router.replace(`/results/${report.id}` as any);
      }, 1000);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Exam submission error:", err);
      useExamStore.setState({ isSubmitting: false });
      setSubmittingModalVisible(false);
      Alert.alert("Submission Error", "Submission failed. Please check network connection.");
    }
  };

  // Requirement 8: Defensive Timer Formatter (Guarantees no NaN:NaN)
  const formatTimerDefensive = (seconds?: number | null) => {
    if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
      return "00:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || !currentExam) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Examination Paper...</Text>
      </View>
    );
  }

  const currentQ: Question | undefined = questions[currentQuestionIndex];
  const isMarked = currentQ ? markedForReview.includes(currentQ.id) : false;
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const reviewCount = markedForReview.length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <View style={[styles.container, { paddingTop: Math.max(responsive.safeTop, 12) }]}>
      {/* 1. Top Fixed Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleLeaveExam} activeOpacity={0.7}>
          <ChevronLeft color="#0F172A" size={24} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.examTitleHeader} numberOfLines={1}>
            {currentExam.title}
          </Text>
          <Text style={styles.questionProgressText}>
            Q {currentQuestionIndex + 1} of {questions.length} • {answeredCount} Answered
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            style={styles.paletteTriggerBtn}
            onPress={() => setShowPaletteModal(true)}
            activeOpacity={0.85}
          >
            <Grid size={18} color="#4F46E5" />
          </TouchableOpacity>

          <View style={[styles.timerChip, remainingSeconds < 300 && styles.timerChipWarning]}>
            <Clock size={14} color={remainingSeconds < 300 ? "#EF4444" : "#D97706"} />
            <Text style={[styles.timerText, remainingSeconds < 300 && styles.timerWarningText]}>
              {formatTimerDefensive(remainingSeconds)}
            </Text>
          </View>
        </View>
      </View>

      {/* Draft Restored Banner */}
      {draftRestored ? (
        <View style={styles.draftBanner}>
          <CheckCircle2 size={14} color="#10B981" />
          <Text style={styles.draftBannerText}>Restored your previous saved attempt progress.</Text>
        </View>
      ) : null}

      {/* 2. Subheader Progress & Meta Actions Row */}
      <View style={styles.subHeaderMetaRow}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>Question {currentQuestionIndex + 1}</Text>
          <View style={styles.marksTag}>
            <Text style={styles.marksTagText}>+{currentQ?.marks || 1} Marks</Text>
          </View>
        </View>

        <View style={styles.metaActionsRow}>
          {currentAnswer !== undefined && currentAnswer !== "" ? (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => currentQ && handleClearAnswer(currentQ.id)}
            >
              <Trash2 size={13} color="#EF4444" />
              <Text style={styles.clearBtnText}>Clear Answer</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.reviewBtn, isMarked && styles.reviewBtnActive]}
            onPress={() => currentQ && toggleMarkForReview(currentQ.id)}
          >
            <Bookmark size={14} color={isMarked ? "#D97706" : "#64748B"} />
            <Text style={[styles.reviewBtnText, isMarked && styles.reviewBtnTextActive]}>
              {isMarked ? "Marked" : "Review"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Main Question Content Body (Requirement 3: Always visible, properly scrollable) */}
      {currentQ ? (
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={[
            styles.bodyContent,
            responsive.isLandscape && { flexDirection: "row", gap: 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Text Column */}
          <View style={[styles.questionColumn, responsive.isLandscape && { flex: 1 }]}>
            <Text style={styles.questionText}>{getQuestionText(currentQ)}</Text>

            {/* Optional Attached Question Media Image */}
            {currentQ.imageUrl ? (
              <Image
                source={{ uri: currentQ.imageUrl }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Answer Options Column */}
          <View style={[styles.optionsColumn, responsive.isLandscape && { flex: 1 }]}>
            {currentQ.options && currentQ.options.length > 0 ? (
              <View style={styles.optionsContainer}>
                {currentQ.options.map((rawOpt, optIdx) => {
                  const optObj = normalizeQuestionOption(rawOpt, optIdx);
                  const isOptionSelected =
                    currentAnswer === rawOpt || currentAnswer === optObj.text || currentAnswer === optIdx;
                  const optionLabel = optObj.id;

                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={[styles.optionCard, isOptionSelected && styles.optionCardSelected]}
                      onPress={() => handleSelectAnswer(currentQ.id, optObj.text)}
                      activeOpacity={0.75}
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
              <Text style={styles.noOptionsText}>Numerical / Subjective response required.</Text>
            )}
          </View>
        </ScrollView>
      ) : null}

      {/* 4. Bottom Action Bar (Requirement 10) */}
      <View style={[styles.footer, { paddingBottom: Math.max(responsive.safeBottom, 14) }]}>
        <TouchableOpacity
          style={[styles.navBtn, currentQuestionIndex === 0 && styles.navBtnDisabled]}
          onPress={prevQuestion}
          disabled={currentQuestionIndex === 0}
          activeOpacity={0.7}
        >
          <ChevronLeft color={currentQuestionIndex === 0 ? "#94A3B8" : "#0F172A"} size={20} />
          <Text style={[styles.navBtnText, currentQuestionIndex === 0 && styles.navBtnTextDisabled]}>
            Prev
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paletteTriggerFooterBtn}
          onPress={() => setShowPaletteModal(true)}
          activeOpacity={0.7}
        >
          <Grid size={16} color="#4F46E5" />
          <Text style={styles.paletteTriggerFooterText}>Palette</Text>
        </TouchableOpacity>

        {currentQuestionIndex < questions.length - 1 ? (
          <TouchableOpacity style={styles.navBtnPrimary} onPress={nextQuestion} activeOpacity={0.85}>
            <Text style={styles.navBtnPrimaryText}>Next</Text>
            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={() => setShowSubmitConfirmModal(true)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send color="#FFFFFF" size={16} />
                <Text style={styles.submitBtnText}>Submit Exam</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 5. Submit Examination Confirmation Modal (Requirement 11) */}
      <Modal
        visible={showSubmitConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSubmitConfirmModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmHeader}>
              <AlertTriangle color="#F59E0B" size={28} />
              <Text style={styles.confirmTitle}>Submit Examination?</Text>
            </View>

            <Text style={styles.confirmSubtitle}>
              Please review your attempt statistics before finalizing submission:
            </Text>

            <View style={styles.confirmStatsCard}>
              <View style={styles.confirmStatRow}>
                <Text style={styles.confirmStatLabel}>Answered Questions:</Text>
                <Text style={[styles.confirmStatVal, { color: "#059669" }]}>{answeredCount}</Text>
              </View>

              <View style={styles.confirmStatRow}>
                <Text style={styles.confirmStatLabel}>Unanswered Questions:</Text>
                <Text style={[styles.confirmStatVal, { color: "#DC2626" }]}>{unansweredCount}</Text>
              </View>

              <View style={styles.confirmStatRow}>
                <Text style={styles.confirmStatLabel}>Marked for Review:</Text>
                <Text style={[styles.confirmStatVal, { color: "#D97706" }]}>{reviewCount}</Text>
              </View>

              <View style={[styles.confirmStatRow, { borderBottomWidth: 0, paddingTop: 8 }]}>
                <Text style={[styles.confirmStatLabel, { fontWeight: "800", color: "#0F172A" }]}>Total Questions:</Text>
                <Text style={[styles.confirmStatVal, { fontWeight: "800", color: "#4F46E5" }]}>{questions.length}</Text>
              </View>
            </View>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowSubmitConfirmModal(false)}
              >
                <Text style={styles.cancelModalBtnText}>Continue Exam</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitModalBtnConfirm}
                onPress={executeFinalSubmission}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalBtnConfirmText}>Confirm & Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5.5. Live Report Processing & AI Generation Modal */}
      <Modal
        visible={submittingModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.confirmModalContent, { alignItems: "center", paddingVertical: 28 }]}>
            <ActivityIndicator color="#4F46E5" size="large" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 6 }}>
              Generating Performance Report
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 20, textAlign: "center", paddingHorizontal: 10 }}>
              {submittingStepText}
            </Text>

            {/* Animated Progress Bar */}
            <View style={{ width: "100%", height: 10, backgroundColor: "#E2E8F0", borderRadius: 5, overflow: "hidden", marginBottom: 10 }}>
              <View style={{ width: `${submittingProgress}%`, height: "100%", backgroundColor: "#4F46E5", borderRadius: 5 }} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#4F46E5" }}>
              {submittingProgress}% Completed
            </Text>
          </View>
        </View>
      </Modal>

      {/* 6. Compact Question Palette Grid Modal (Requirement 9) */}
      <Modal
        visible={showPaletteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaletteModal(false)}
      >
        <View style={styles.modalOverlayBottom}>
          <SafeAreaView style={styles.modalContentBottom}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Grid size={20} color="#4F46E5" />
                <Text style={styles.modalTitle}>Question Navigator</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPaletteModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Legend Row */}
            <View style={styles.modalLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#4F46E5" }]} />
                <Text style={styles.legendText}>Current</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#10B981" }]} />
                <Text style={styles.legendText}>Answered ({answeredCount})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#F59E0B" }]} />
                <Text style={styles.legendText}>Review ({reviewCount})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#E2E8F0" }]} />
                <Text style={styles.legendText}>Unanswered ({unansweredCount})</Text>
              </View>
            </View>

            {/* Question Grid */}
            <ScrollView contentContainerStyle={styles.modalGrid} showsVerticalScrollIndicator={false}>
              {questions.map((q, idx) => {
                const isSelected = idx === currentQuestionIndex;
                const isAns = answers[q.id] !== undefined && answers[q.id] !== "";
                const isRev = markedForReview.includes(q.id);

                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.modalGridNode,
                      isAns && styles.paletteNodeAnswered,
                      isRev && styles.paletteNodeReview,
                      isSelected && styles.paletteNodeSelected,
                    ]}
                    onPress={() => {
                      goToQuestion(idx);
                      setShowPaletteModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.paletteNodeText,
                        isSelected && styles.paletteNodeTextSelected,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
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
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  iconBtn: {
    padding: 6,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  examTitleHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  questionProgressText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  paletteTriggerBtn: {
    padding: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  timerChipWarning: {
    backgroundColor: "#FEF2F2",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  timerText: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "800",
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
  subHeaderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  questionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  questionBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  marksTag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marksTagText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "800",
  },
  metaActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reviewBtnActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  reviewBtnText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewBtnTextActive: {
    color: "#D97706",
    fontWeight: "700",
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 36,
  },
  questionColumn: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 26,
  },
  questionImage: {
    width: "100%",
    height: 200,
    marginTop: 16,
    borderRadius: 12,
  },
  optionsColumn: {
    width: "100%",
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
    borderWidth: 1.5,
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
    fontWeight: "800",
  },
  optionRadioTextSelected: {
    color: "#FFFFFF",
  },
  optionText: {
    flex: 1,
    color: "#334155",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  optionTextSelected: {
    color: "#0F172A",
    fontWeight: "700",
  },
  noOptionsText: {
    color: "#64748B",
    fontStyle: "italic",
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 10,
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
  paletteTriggerFooterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  paletteTriggerFooterText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmModalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },
  confirmSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 18,
  },
  confirmStatsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  confirmStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  confirmStatLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  confirmStatVal: {
    fontSize: 14,
    fontWeight: "700",
  },
  confirmBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  submitModalBtnConfirm: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  submitModalBtnConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContentBottom: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  modalLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 12,
    justifyContent: "flex-start",
  },
  modalGridNode: {
    width: 52,
    height: 52,
    borderRadius: 12,
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
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 2,
  },
  paletteNodeSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#3730A3",
    borderWidth: 2.5,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  paletteNodeText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  paletteNodeTextSelected: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
