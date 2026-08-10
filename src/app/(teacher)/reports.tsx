import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getTeacherReports } from "../../services/firestore";
import type { Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileBarChart, Users, CheckCircle2, XCircle, ArrowRight } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherReportsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTeacherReports(user);
      setReports(data);
    } catch (err) {
      console.error("Error loading teacher reports:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Student Diagnostic Reports"
        subtitle="Institutional assessment scorecards & performance analytics"
        fallbackRoute="/(teacher)"
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
        ) : reports.length > 0 ? (
          reports.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              onPress={() => router.push(`/results/${r.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{r.studentName || "Student Attempt"}</Text>
                  <Text style={styles.studentMeta}>
                    Grade {r.grade || "12"} • {r.studentEmail}
                  </Text>
                </View>
                <View
                  style={[
                    styles.scorePill,
                    { backgroundColor: r.passed ? "#ECFDF5" : "#FEF2F2" },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreText,
                      { color: r.passed ? "#059669" : "#DC2626" },
                    ]}
                  >
                    {r.percentage}%
                  </Text>
                </View>
              </View>

              <Text style={styles.examTitle}>{r.examTitle || "Assessment Paper"}</Text>
              
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Marks: {r.obtainedMarks} / {r.totalMarks}
                </Text>
                <Text style={styles.metaText}>
                  Time: {Math.floor((r.timeSpentSeconds || 0) / 60)} mins
                </Text>
                <Text style={styles.metaText}>
                  Accuracy: {r.accuracy || 0}%
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <FileBarChart size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Diagnostic Reports Available</Text>
            <Text style={styles.emptySubtitle}>Student exam attempts and diagnostic scorecards will appear here.</Text>
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
    alignItems: "flex-start",
    marginBottom: 6,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  studentMeta: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "800",
  },
  examTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.primary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textMuted,
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
