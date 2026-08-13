import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getStudentExams, getStudentExamAttempts } from "../../services/firestore";
import type { Exam, ExamAttempt } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileText, Clock, ChevronRight, CheckCircle2, PlayCircle, AlertCircle, RefreshCw } from "lucide-react-native";

export default function StudentExamsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [exams, setExams] = useState<Exam[]>([]);
  const [attemptsMap, setAttemptsMap] = useState<Record<string, ExamAttempt[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getStudentExams(user);
      setExams(data);

      if (user?.uid) {
        const attMap: Record<string, ExamAttempt[]> = {};
        for (const ex of data) {
          const list = await getStudentExamAttempts(ex.id, user.uid);
          attMap[ex.id] = list;
        }
        setAttemptsMap(attMap);
      }
    } catch (err) {
      console.error("Error loading exams:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  const handleExamPress = (exam: Exam, isLimitReached: boolean, maxAttemptsVal: any) => {
    if (isLimitReached) {
      Alert.alert(
        "Attempt Limit Reached",
        `You have used all ${maxAttemptsVal} attempt${maxAttemptsVal === 1 ? "" : "s"} allowed for this examination.`
      );
      return;
    }
    router.push(`/exam/${exam.id}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={ZEEPREP_THEME.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assigned Examinations</Text>
        <Text style={styles.headerSubtitle}>
          Active assessments for Grade {user?.grade || "10"} • {user?.section || "Section A"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
      ) : exams.length > 0 ? (
        exams.map((exam) => {
          const userAttempts = attemptsMap[exam.id] || [];
          const usedCount = userAttempts.length;
          const maxAttemptsSetting = exam.maxAttempts || 1;
          const isUnlimited = maxAttemptsSetting === "unlimited";
          const maxAttemptsNum = isUnlimited ? Infinity : Number(maxAttemptsSetting);
          const isLimitReached = !isUnlimited && usedCount >= maxAttemptsNum;
          const attemptsRemaining = isUnlimited ? "Unlimited" : Math.max(0, maxAttemptsNum - usedCount);

          return (
            <TouchableOpacity
              key={exam.id}
              style={[styles.examCard, isLimitReached && styles.examCardDisabled]}
              onPress={() => handleExamPress(exam, isLimitReached, maxAttemptsSetting)}
              activeOpacity={isLimitReached ? 0.9 : 0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{exam.subject?.toUpperCase() || "ASSESSMENT"}</Text>
                </View>
                <View style={styles.timeBadge}>
                  <Clock size={12} color="#D97706" />
                  <Text style={styles.timeBadgeText}>{exam.durationMinutes || 60} Mins</Text>
                </View>
              </View>

              <Text style={styles.examTitle}>{exam.title}</Text>

              {/* Requirement 31.10: Show Attempt Rules to Student */}
              <View style={styles.attemptMetaRow}>
                <View style={styles.attemptPillTag}>
                  <RefreshCw size={11} color="#475569" />
                  <Text style={styles.attemptPillTagText}>
                    Max Attempts: {isUnlimited ? "Unlimited" : maxAttemptsSetting}
                  </Text>
                </View>
                <View style={styles.attemptPillTag}>
                  <Text style={styles.attemptPillTagText}>
                    Used: {usedCount} {isUnlimited ? "" : `/ ${maxAttemptsSetting}`}
                  </Text>
                </View>
                {!isUnlimited ? (
                  <View
                    style={[
                      styles.attemptPillTag,
                      isLimitReached
                        ? { backgroundColor: "#FEF2F2" }
                        : { backgroundColor: "#ECFDF5" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.attemptPillTagText,
                        { color: isLimitReached ? "#DC2626" : "#059669", fontWeight: "700" },
                      ]}
                    >
                      Remaining: {attemptsRemaining}
                    </Text>
                  </View>
                ) : null}
              </View>

              {isLimitReached ? (
                <View style={styles.limitReachedNotice}>
                  <AlertCircle size={14} color="#DC2626" />
                  <Text style={styles.limitNoticeText}>
                    Attempt Limit Reached (Used {usedCount} / {maxAttemptsSetting})
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.marksText}>Total Marks: {exam.totalMarks || 100}</Text>
                <View style={[styles.startBtn, isLimitReached && styles.startBtnDisabled]}>
                  {isLimitReached ? (
                    <AlertCircle size={16} color="#94A3B8" />
                  ) : (
                    <PlayCircle size={16} color="#FFFFFF" />
                  )}
                  <Text style={[styles.startBtnText, isLimitReached && styles.startBtnTextDisabled]}>
                    {isLimitReached
                      ? "Limit Reached"
                      : usedCount > 0
                      ? `Start Attempt ${usedCount + 1}`
                      : "Start Exam"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <FileText size={40} color={ZEEPREP_THEME.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Active Exams</Text>
          <Text style={styles.emptySub}>
            There are currently no active assessments assigned to your grade and section.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 4,
  },
  examCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectChip: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "700",
  },
  examTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  marksText: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  examCardDisabled: {
    opacity: 0.85,
    backgroundColor: "#FAFAFA",
  },
  attemptMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  attemptPillTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  attemptPillTagText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  limitReachedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  limitNoticeText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "700",
  },
  startBtnDisabled: {
    backgroundColor: "#E2E8F0",
  },
  startBtnTextDisabled: {
    color: "#94A3B8",
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
