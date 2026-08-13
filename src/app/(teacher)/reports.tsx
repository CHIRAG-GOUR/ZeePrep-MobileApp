import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getTeacherReports } from "../../services/firestore";
import type { Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileBarChart, Search, ChevronRight } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherReportsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (r.studentName || "").toLowerCase();
    const email = (r.studentEmail || "").toLowerCase();
    const title = (r.examTitle || "").toLowerCase();
    const grade = (r.grade || "").toLowerCase();
    return name.includes(q) || email.includes(q) || title.includes(q) || grade.includes(q);
  });

  return (
    <View style={styles.container}>
      <AppHeader
        title="Student Diagnostic Reports"
        subtitle="Institutional assessment scorecards & performance analytics"
      />

      <View style={styles.searchBarContainer}>
        <Search size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name, exam title, grade..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
        ) : filteredReports.length > 0 ? (
          filteredReports.map((r) => (
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
                    Grade {r.grade || "10"} • {r.studentEmail || "Student"}
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
                  Time: {Math.floor((r.timeSpentSeconds || 0) / 60)}m {(r.timeSpentSeconds || 0) % 60}s
                </Text>
                <Text style={styles.metaText}>
                  Accuracy: {r.accuracy || 0}%
                </Text>
              </View>

              <View style={styles.actionRow}>
                <Text style={styles.actionText}>View Detailed Faculty Diagnostic</Text>
                <ChevronRight size={16} color="#4F46E5" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <FileBarChart size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Diagnostic Reports Available</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "No reports match your current search query."
                : "Student exam attempts and diagnostic scorecards will appear here."}
            </Text>
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
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
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
    marginBottom: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  studentMeta: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textMuted,
    marginTop: 2,
  },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "800",
  },
  examTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
