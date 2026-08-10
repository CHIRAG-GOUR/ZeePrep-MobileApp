import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getStudentExams } from "../../services/firestore";
import type { Exam } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileText, Clock, ChevronRight, CheckCircle2, PlayCircle } from "lucide-react-native";

export default function StudentExamsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getStudentExams(user);
      setExams(data);
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
          Active assessments for Grade {user?.grade || "12"} • {user?.section || "Section A"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
      ) : exams.length > 0 ? (
        exams.map((exam) => (
          <TouchableOpacity
            key={exam.id}
            style={styles.examCard}
            onPress={() => router.push(`/exam/${exam.id}`)}
            activeOpacity={0.85}
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

            <View style={styles.cardFooter}>
              <Text style={styles.marksText}>Total Marks: {exam.totalMarks || 100}</Text>
              <View style={styles.startBtn}>
                <PlayCircle size={16} color="#FFFFFF" />
                <Text style={styles.startBtnText}>Start Exam</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
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
