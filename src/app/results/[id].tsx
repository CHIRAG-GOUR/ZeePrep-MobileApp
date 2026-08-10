import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getStudentReport } from "../../services/firestore";
import type { Report } from "../../types";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  ChevronLeft,
  Home,
  HelpCircle,
  TrendingUp,
} from "lucide-react-native";

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      if (!id || !user) return;
      setLoading(true);
      const data = await getStudentReport(id as string, user.uid);
      setReport(data);
      setLoading(false);
    }

    loadReport();
  }, [id, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#818CF8" />
        <Text style={styles.loadingText}>Generating Performance Report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Report not found or not yet processed.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace("/(tabs)")}>
          <Home color="#FFFFFF" size={18} />
          <Text style={styles.backHomeText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mins = Math.floor((report.timeSpentSeconds || 0) / 60);
  const secs = (report.timeSpentSeconds || 0) % 60;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.replace("/(tabs)")}>
          <ChevronLeft color="#F8FAFC" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Examination Scorecard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Hero Card */}
        <View style={[styles.heroCard, report.passed ? styles.heroPassed : styles.heroFailed]}>
          <View style={styles.passBadge}>
            <Text style={[styles.passBadgeText, report.passed ? styles.textPassed : styles.textFailed]}>
              {report.passed ? "PASSED" : "NEEDS IMPROVEMENT"}
            </Text>
          </View>

          <Text style={styles.scoreText}>
            {report.obtainedMarks} <Text style={styles.totalScoreText}>/ {report.totalMarks}</Text>
          </Text>
          <Text style={styles.examTitle}>{report.examTitle}</Text>

          <View style={styles.percentagePill}>
            <Award color="#F59E0B" size={18} />
            <Text style={styles.percentageText}>{report.percentage}% Score</Text>
          </View>
        </View>

        {/* Diagnostics Grid */}
        <Text style={styles.sectionTitle}>Performance Analytics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Target color="#818CF8" size={22} />
            <Text style={styles.statVal}>{report.accuracy}%</Text>
            <Text style={styles.statLbl}>Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <CheckCircle2 color="#10B981" size={22} />
            <Text style={styles.statVal}>{report.correctAnswers}</Text>
            <Text style={styles.statLbl}>Correct</Text>
          </View>

          <View style={styles.statCard}>
            <XCircle color="#EF4444" size={22} />
            <Text style={styles.statVal}>{report.incorrectAnswers}</Text>
            <Text style={styles.statLbl}>Incorrect</Text>
          </View>

          <View style={styles.statCard}>
            <HelpCircle color="#F59E0B" size={22} />
            <Text style={styles.statVal}>{report.unattempted}</Text>
            <Text style={styles.statLbl}>Unattempted</Text>
          </View>
        </View>

        {/* Time Spent */}
        <View style={styles.timeCard}>
          <Clock color="#818CF8" size={20} />
          <View style={styles.timeContent}>
            <Text style={styles.timeLbl}>Total Time Spent</Text>
            <Text style={styles.timeVal}>
              {mins} mins {secs} secs
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Home color="#FFFFFF" size={18} />
          <Text style={styles.homeBtnText}>Return to Student Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 20,
    gap: 12,
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  backHomeBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backHomeText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  heroPassed: {
    backgroundColor: "#FFFFFF",
    borderColor: "#10B981",
  },
  heroFailed: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EF4444",
  },
  passBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
  passBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  textPassed: {
    color: "#059669",
  },
  textFailed: {
    color: "#DC2626",
  },
  scoreText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0F172A",
  },
  totalScoreText: {
    fontSize: 24,
    color: "#64748B",
    fontWeight: "600",
  },
  examTitle: {
    fontSize: 16,
    color: "#475569",
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  percentagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  percentageText: {
    color: "#D97706",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  statVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  statLbl: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 28,
  },
  timeContent: {
    marginLeft: 12,
  },
  timeLbl: {
    fontSize: 12,
    color: "#64748B",
  },
  timeVal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  homeBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  homeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
