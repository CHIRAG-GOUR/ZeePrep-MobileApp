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
import { getStudentExams, getStudyResources } from "../../services/firestore";
import type { Exam, StudyResource } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  FileCheck,
  TrendingUp,
  FileBarChart,
  Trophy,
  Bot,
  User as UserIcon,
} from "lucide-react-native";
import { normalizeResourceType } from "../../utils/resource-normalizer";

import SuperAdminRoleSwitcher from "../../components/SuperAdminRoleSwitcher";

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [exams, setExams] = useState<Exam[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedExams, fetchedResources] = await Promise.all([
        getStudentExams(user),
        getStudyResources(user),
      ]);
      setExams(fetchedExams);
      setResources(fetchedResources);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
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

  const activeExams = exams.filter((e) => e.status === "published");

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

      {/* Student Welcome Card Header */}
      <View style={styles.welcomeCard}>
        <View style={styles.userInfoRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || "S"}</Text>
          </View>
          <View style={styles.userTextCol}>
            <View style={styles.badgeRow}>
              <Award size={14} color={ZEEPREP_THEME.colors.primary} />
              <Text style={styles.roleBadge}>{user?.role?.toUpperCase() || "STUDENT"}</Text>
            </View>
            <Text style={styles.userName}>{user?.name || "Welcome Back!"}</Text>
            <Text style={styles.academicMeta}>
              {user?.grade ? `Grade ${user.grade}` : "Class N/A"} • {user?.board || "ZeePrep Academic"}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <FileCheck color={ZEEPREP_THEME.colors.primary} size={22} />
          <Text style={styles.statNumber}>{activeExams.length}</Text>
          <Text style={styles.statLabel}>Available Exams</Text>
        </View>

        <View style={styles.statBox}>
          <TrendingUp color="#059669" size={22} />
          <Text style={styles.statNumber}>94%</Text>
          <Text style={styles.statLabel}>Avg Accuracy</Text>
        </View>

        <View style={styles.statBox}>
          <Award color="#D97706" size={22} />
          <Text style={styles.statNumber}>Top 5</Text>
          <Text style={styles.statLabel}>Class Rank</Text>
        </View>
      </View>

      {/* ZeePrep Suite Quick Access Feature Grid */}
      <Text style={styles.sectionTitle}>ZeePrep Feature Suite</Text>
      <View style={styles.featureGrid}>
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(tabs)/exams")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#EEF2FF" }]}>
            <FileCheck color={ZEEPREP_THEME.colors.primary} size={20} />
          </View>
          <Text style={styles.featureTitle}>Exams</Text>
          <Text style={styles.featureSub}>Assessments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(tabs)/reports")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#ECFDF5" }]}>
            <FileBarChart color="#059669" size={20} />
          </View>
          <Text style={styles.featureTitle}>Reports</Text>
          <Text style={styles.featureSub}>Scorecards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(tabs)/resources")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#FEF3C7" }]}>
            <BookOpen color="#D97706" size={20} />
          </View>
          <Text style={styles.featureTitle}>Library</Text>
          <Text style={styles.featureSub}>Materials</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(tabs)/leaderboard")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#F3E8FF" }]}>
            <Trophy color="#7C3AED" size={20} />
          </View>
          <Text style={styles.featureTitle}>Rankings</Text>
          <Text style={styles.featureSub}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(tabs)/ai-tutor")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#E0E7FF" }]}>
            <Bot color="#4F46E5" size={20} />
          </View>
          <Text style={styles.featureTitle}>AI Tutor</Text>
          <Text style={styles.featureSub}>Copilot</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.85}
        >
          <View style={[styles.featureIcon, { backgroundColor: "#F1F5F9" }]}>
            <UserIcon color="#475569" size={20} />
          </View>
          <Text style={styles.featureTitle}>Profile</Text>
          <Text style={styles.featureSub}>Account</Text>
        </TouchableOpacity>
      </View>

      {/* Active & Scheduled Exams Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active & Scheduled Exams</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/exams")}>
          <Text style={styles.seeAllText}>See All ({exams.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginVertical: 20 }} />
      ) : activeExams.length > 0 ? (
        activeExams.slice(0, 2).map((exam) => (
          <TouchableOpacity
            key={exam.id}
            style={styles.examCard}
            onPress={() => router.push(`/exam/${exam.id}` as any)}
            activeOpacity={0.85}
          >
            <View style={styles.examBadgeHeader}>
              <View style={styles.subjectChip}>
                <Text style={styles.subjectChipText}>{exam.subject || "General"}</Text>
              </View>
              <View style={styles.timerBadge}>
                <Clock size={14} color="#D97706" />
                <Text style={styles.timerText}>{exam.durationMinutes} mins</Text>
              </View>
            </View>

            <Text style={styles.examCardTitle}>{exam.title}</Text>
            <Text style={styles.examCardMeta}>
              Grade {exam.grade || "12"} • {exam.totalMarks || 100} Marks • {exam.questions?.length || 10} Items
            </Text>

            <View style={styles.examCardFooter}>
              <Text style={styles.startText}>Tap to Start Exam</Text>
              <ChevronRight color={ZEEPREP_THEME.colors.primary} size={18} />
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No pending exams assigned right now.</Text>
        </View>
      )}

      {/* Recent Authorized Study Resources */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Study Materials</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/resources")}>
          <Text style={styles.seeAllText}>Browse All</Text>
        </TouchableOpacity>
      </View>

      {resources.length > 0 ? (
        resources.slice(0, 3).map((rawRes) => {
          const res = normalizeResourceType(rawRes);
          return (
            <View key={res.id} style={styles.resourceItem}>
              <View style={styles.resourceIconBox}>
                <BookOpen color={ZEEPREP_THEME.colors.primary} size={20} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>{res.title}</Text>
                <Text style={styles.resourceMeta}>
                  {res.subject} • {res.displayType}
                </Text>
              </View>
              <ChevronRight color={ZEEPREP_THEME.colors.textMuted} size={18} />
            </View>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No study materials uploaded for your grade yet.</Text>
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
    marginBottom: 2,
  },
  roleBadge: {
    color: ZEEPREP_THEME.colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 19,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  academicMeta: {
    fontSize: 12,
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
    borderRadius: 16,
    padding: 14,
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
    fontSize: 17,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
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
    fontWeight: "600",
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
  examBadgeHeader: {
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
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timerText: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "700",
  },
  examCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 4,
  },
  examCardMeta: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginBottom: 12,
  },
  examCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  startText: {
    fontSize: 13,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.primary,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  resourceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  resourceMeta: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
  },
});
