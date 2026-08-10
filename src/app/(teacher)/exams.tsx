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
import { getTeacherExams } from "../../services/firestore";
import type { Exam } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileCheck, Plus, Clock, ChevronRight } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherExamsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTeacherExams(user);
      setExams(data);
    } catch (err) {
      console.error("Error fetching exams:", err);
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
    <View style={styles.container}>
      <AppHeader
        title="Created Assessments"
        subtitle="Manage published diagnostic exams"
        fallbackRoute="/(teacher)"
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/(teacher)/exam-builder")}
          >
            <Plus color="#FFFFFF" size={16} />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ZEEPREP_THEME.colors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
        ) : exams.length > 0 ? (
          exams.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={styles.card}
              onPress={() => router.push("/(teacher)/submissions")}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{exam.subject?.toUpperCase() || "GENERAL"}</Text>
                </View>
                <Text style={styles.durationText}>{exam.durationMinutes || 60} Mins</Text>
              </View>

              <Text style={styles.examTitle}>{exam.title}</Text>
              <Text style={styles.metaText}>
                Grade {exam.grade || "10"} • Sec {exam.section || "A"} • {exam.totalMarks || 100} Marks
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <FileCheck size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Assessments Created</Text>
            <Text style={styles.emptySubtitle}>Tap + Create to construct your first exam paper.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectChip: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectChipText: {
    color: ZEEPREP_THEME.colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  durationText: {
    color: "#D97706",
    fontSize: 12,
    fontWeight: "600",
  },
  examTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  emptyBox: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
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
  emptySubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
  },
});
