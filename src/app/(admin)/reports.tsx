import React, { useState, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { getAllStudentReports } from "../../services/firestore";
import type { Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { Award, Search, ChevronRight, Clock, Target, CheckCircle2 } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function AdminReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getAllStudentReports();
      setReports(data);
    } catch (err) {
      console.error("Error loading admin reports:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch automatically whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

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
    const subject = (r.subject || (r as any).examSubject || "").toLowerCase();
    return (
      name.includes(q) ||
      email.includes(q) ||
      title.includes(q) ||
      grade.includes(q) ||
      subject.includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <AppHeader
        title="Institutional Diagnostics"
        subtitle="Student scorecards & performance analytics"
        fallbackRoute="/(admin)"
      />

      <View style={styles.searchBarContainer}>
        <Search size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student, exam title, grade..."
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
          filteredReports.map((r) => {
            const mins = Math.floor((r.timeSpentSeconds || 0) / 60);
            const secs = (r.timeSpentSeconds || 0) % 60;
            return (
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

                <Text style={styles.examTitle}>{r.examTitle || "Assessment Report"}</Text>

                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Target size={14} color="#6366F1" />
                    <Text style={styles.metricText}>
                      {r.obtainedMarks} / {r.totalMarks} Marks
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={styles.metricText}>
                      {r.correctAnswers} / {r.totalQuestions} Qs
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Clock size={14} color="#64748B" />
                    <Text style={styles.metricText}>
                      {mins}m {secs}s
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.viewDetailsText}>View Diagnostic Breakdown</Text>
                  <ChevronRight size={16} color={ZEEPREP_THEME.colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Award size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Diagnostic Reports Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "No completed student reports match your search query."
                : "Student scorecards will populate here across all classes and subjects."}
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
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
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
    padding: 0,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
    marginRight: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  studentMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "800",
  },
  examTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.primary,
  },
  emptyBox: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textMuted,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
