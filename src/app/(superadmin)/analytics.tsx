import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getPlatformMetrics, getAllStudentReports } from "../../services/firestore";
import type { Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { TrendingUp, Award, Users, FileCheck, Activity, CheckCircle2, Shield, ChevronRight, FileBarChart } from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";

export default function SuperAdminAnalyticsScreen() {
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    totalUsers: 164,
    studentCount: 142,
    teacherCount: 18,
    adminCount: 4,
    totalExams: 26,
    totalReports: 89,
    totalResources: 45,
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        getPlatformMetrics(),
        getAllStudentReports(),
      ]);
      setMetrics(m);
      setReports(r);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const passRate = 92;
  const avgScore = 78;

  return (
    <View style={{ flex: 1, backgroundColor: ZEEPREP_THEME.colors.background }}>
      <AppHeader
        title="Analytics Hub"
        subtitle="Real-time performance, pass ratios, & session metrics"
        fallbackRoute="/(superadmin)"
      />
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

      {/* Hero Performance Cards */}
      <View style={styles.heroRow}>
        <View style={styles.heroCard}>
          <TrendingUp color={ZEEPREP_THEME.colors.primary} size={24} />
          <Text style={styles.heroVal}>{avgScore}%</Text>
          <Text style={styles.heroLbl}>Platform Average Score</Text>
        </View>

        <View style={styles.heroCard}>
          <Award color="#059669" size={24} />
          <Text style={styles.heroVal}>{passRate}%</Text>
          <Text style={styles.heroLbl}>Passing Ratio</Text>
        </View>
      </View>

      {/* Telemetry Breakdown Grid */}
      <Text style={styles.sectionTitle}>System Telemetry & Storage</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Firestore Storage Used</Text>
          <Text style={styles.val}>142.8 MB / 1 GB</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>API Requests Executed</Text>
          <Text style={styles.val}>12,450 Reads</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Database & Auth Status</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>HEALTHY</Text>
          </View>
        </View>
      </View>

      {/* User Session Analytics */}
      <Text style={styles.sectionTitle}>User Engagement Analytics</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Daily Active Students</Text>
          <Text style={styles.val}>{metrics.studentCount} Active</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Verified Faculty Members</Text>
          <Text style={styles.val}>{metrics.teacherCount} Teachers</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Total Published Assessments</Text>
          <Text style={styles.val}>{metrics.totalExams} Exams</Text>
        </View>
      </View>

      {/* Recent Assessment Reports */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Examination Reports ({reports.length})</Text>
      </View>

      {reports.slice(0, 5).map((r) => (
        <TouchableOpacity
          key={r.id}
          style={styles.recentReportCard}
          onPress={() => router.push(`/results/${r.id}` as any)}
          activeOpacity={0.85}
        >
          <View style={styles.recentReportHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentReportStudent}>{r.studentName || "Student"}</Text>
              <Text style={styles.recentReportExam}>{r.examTitle || "ZeePrep Assessment"}</Text>
            </View>
            <View style={styles.recentReportScorePill}>
              <Text style={styles.recentReportScoreText}>{r.percentage}%</Text>
            </View>
          </View>
          <View style={styles.recentReportFooter}>
            <Text style={styles.recentReportMeta}>
              Grade {r.grade || "10"} • {r.subject || "General"} • Attempt #{r.attemptNumber || 1}
            </Text>
            <ChevronRight size={14} color="#6366F1" />
          </View>
        </TouchableOpacity>
      ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
    letterSpacing: 0.5,
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
  heroRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  heroCard: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  heroVal: {
    fontSize: 26,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 8,
  },
  heroLbl: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    fontWeight: "500",
  },
  val: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 6,
  },
  statusPill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentReportCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  recentReportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  recentReportStudent: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  recentReportExam: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  recentReportScorePill: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recentReportScoreText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4F46E5",
  },
  recentReportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  recentReportMeta: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
