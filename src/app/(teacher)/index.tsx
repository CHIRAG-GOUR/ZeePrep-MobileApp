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
import { getTeacherExams, getTeacherReports } from "../../services/firestore";
import type { Exam, Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  BookOpen,
  FileCheck,
  Users,
  Award,
  HelpCircle,
  PlusCircle,
  Activity,
  FolderKanban,
  User as UserIcon,
} from "lucide-react-native";

import SuperAdminRoleSwitcher from "../../components/SuperAdminRoleSwitcher";

export default function TeacherDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [exams, setExams] = useState<Exam[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedExams, fetchedReports] = await Promise.all([
        getTeacherExams(user),
        getTeacherReports(user),
      ]);
      setExams(fetchedExams);
      setReports(fetchedReports);
    } catch (err) {
      console.error("Error loading teacher dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
      {/* Super Admin Role Switcher */}
      <SuperAdminRoleSwitcher />

      {/* Teacher Header Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.userInfoRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || "T"}</Text>
          </View>
          <View style={styles.userTextCol}>
            <View style={styles.badgeRow}>
              <Award size={14} color={ZEEPREP_THEME.colors.primary} />
              <Text style={styles.roleBadge}>FACULTY / TEACHER</Text>
            </View>
            <Text style={styles.userName}>{user?.name || "Faculty Member"}</Text>
            <Text style={styles.academicMeta}>
              {user?.subject || "General Science"} • {user?.schoolName || "ZeePrep Faculty"}
            </Text>
          </View>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <FileCheck color={ZEEPREP_THEME.colors.primary} size={22} />
          <Text style={styles.statNumber}>{exams.length}</Text>
          <Text style={styles.statLabel}>Exams Created</Text>
        </View>

        <View style={styles.statBox}>
          <Users color="#059669" size={22} />
          <Text style={styles.statNumber}>{reports.length}</Text>
          <Text style={styles.statLabel}>Submissions</Text>
        </View>
      </View>

      {/* Faculty Tools Feature Grid */}
      <Text style={styles.sectionTitle}>Faculty Control Suite</Text>
      <View style={styles.featureGrid}>
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(teacher)/question-bank")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#EEF2FF" }]}>
            <HelpCircle color={ZEEPREP_THEME.colors.primary} size={20} />
          </View>
          <Text style={styles.featureTitle}>Item Bank</Text>
          <Text style={styles.featureSub}>Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(teacher)/exam-builder")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#ECFDF5" }]}>
            <PlusCircle color="#059669" size={20} />
          </View>
          <Text style={styles.featureTitle}>Creator</Text>
          <Text style={styles.featureSub}>Build Exam</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(teacher)/exams")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#FEF3C7" }]}>
            <FileCheck color="#D97706" size={20} />
          </View>
          <Text style={styles.featureTitle}>Exams</Text>
          <Text style={styles.featureSub}>Published</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(teacher)/submissions")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#F3E8FF" }]}>
            <Activity color="#7C3AED" size={20} />
          </View>
          <Text style={styles.featureTitle}>Monitor</Text>
          <Text style={styles.featureSub}>Live Scores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(teacher)/resources")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#E0E7FF" }]}>
            <FolderKanban color="#4F46E5" size={20} />
          </View>
          <Text style={styles.featureTitle}>Materials</Text>
          <Text style={styles.featureSub}>Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(teacher)/profile")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#F1F5F9" }]}>
            <UserIcon color="#475569" size={20} />
          </View>
          <Text style={styles.featureTitle}>Profile</Text>
          <Text style={styles.featureSub}>Faculty ID</Text>
        </TouchableOpacity>
      </View>

      {/* Active Exams Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Assessments</Text>
        <TouchableOpacity onPress={() => router.push("/(teacher)/exam-builder")}>
          <Text style={styles.seeAllText}>+ New Exam</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginVertical: 20 }} />
      ) : exams.length > 0 ? (
        exams.slice(0, 3).map((exam) => (
          <TouchableOpacity
            key={exam.id}
            style={styles.examCard}
            onPress={() => router.push("/(teacher)/submissions")}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{exam.subject || "GENERAL"}</Text>
              </View>
              <Text style={styles.duration}>{exam.durationMinutes || 60} Mins</Text>
            </View>

            <Text style={styles.examTitle}>{exam.title}</Text>
            <Text style={styles.examMeta}>
              Grade {exam.grade || "10"} • Sec {exam.section || "A"} • Total Marks: {exam.totalMarks || 100}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No exams created yet. Use Creator to draft your first assessment.</Text>
        </View>
      )}

      {/* Recent Submissions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Student Submissions</Text>
      </View>

      {reports.length > 0 ? (
        reports.slice(0, 4).map((report) => (
          <View key={report.id} style={styles.submissionRow}>
            <View style={styles.submissionLeft}>
              <Text style={styles.studentName}>{report.studentName || "Student Attempt"}</Text>
              <Text style={styles.examSubTitle}>{report.examTitle || "Assessment Attempt"}</Text>
            </View>
            <View style={styles.scoreChip}>
              <Text style={styles.scoreChipText}>{report.percentage}%</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No student submissions received yet.</Text>
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
  welcomeCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  roleBadge: {
    color: ZEEPREP_THEME.colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  academicMeta: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  featureCard: {
    width: "31%",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  featureSub: {
    fontSize: 10,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.primary,
    fontWeight: "700",
  },
  examCard: {
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
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chip: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    color: ZEEPREP_THEME.colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  duration: {
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
  examMeta: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  submissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  submissionLeft: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  examSubTitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  scoreChip: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreChipText: {
    color: ZEEPREP_THEME.colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  emptyText: {
    color: ZEEPREP_THEME.colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
});
