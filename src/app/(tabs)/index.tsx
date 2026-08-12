import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
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
  HelpCircle,
  Bookmark,
  FileText,
} from "lucide-react-native";
import { normalizeResourceType } from "../../utils/resource-normalizer";

import SuperAdminRoleSwitcher from "../../components/SuperAdminRoleSwitcher";
import { AdminStatTile } from "../../components/AdminStatTile";

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();

  const isSmall = width < 360;
  const isLarge = width >= 600;
  const hPadding = isSmall ? 24 : isLarge ? 48 : 40;
  const columns = isSmall ? 2 : isLarge ? 4 : 3;
  const tileWidth = Math.floor((width - hPadding - (columns - 1) * 10) / columns);
  const metricWidth = Math.floor((width - hPadding - 2 * 10) / (isLarge ? 3 : 3));

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

      {/* Student Overview Statistics Grid (Explicit 3-Column Horizontal Row) */}
      <View style={styles.gridSection}>
        <View style={styles.gridRow}>
          <AdminStatTile
            icon={<FileCheck color={ZEEPREP_THEME.colors.primary} size={18} />}
            value={activeExams.length}
            label="AVAILABLE"
            iconBgColor="#EEF2FF"
            accessibilityLabel={`${activeExams.length} Available Exams`}
          />

          <AdminStatTile
            icon={<TrendingUp color="#059669" size={18} />}
            value="94%"
            label="ACCURACY"
            iconBgColor="#ECFDF5"
            accessibilityLabel="94 Percent Average Accuracy"
          />

          <AdminStatTile
            icon={<Award color="#D97706" size={18} />}
            value="Top 5"
            label="CLASS RANK"
            iconBgColor="#FEF3C7"
            accessibilityLabel="Top 5 Class Rank"
          />
        </View>
      </View>

      {/* ZeePrep Feature Suite */}
      <View style={styles.styledHeadingBox}>
        <View style={styles.headingAccentBar} />
        <Text style={styles.styledHeadingText}>ZeePrep Feature Suite</Text>
      </View>
      <View style={styles.gridSection}>
        {/* Row 1 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/exams")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#EEF2FF" }]}>
              <FileCheck color={ZEEPREP_THEME.colors.primary} size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Exams</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/reports")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#ECFDF5" }]}>
              <FileBarChart color="#059669" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/resources")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#FEF3C7" }]}>
              <BookOpen color="#D97706" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Library</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/leaderboard")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#F3E8FF" }]}>
              <Trophy color="#7C3AED" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Rankings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/ai-tutor")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#E0E7FF" }]}>
              <Bot color="#4F46E5" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>AI Tutor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#F1F5F9" }]}>
              <UserIcon color="#475569" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/exams")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#EEF2FF" }]}>
              <HelpCircle color="#4F46E5" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Practice Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/resources")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#ECFDF5" }]}>
              <FileText color="#059669" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Study Notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(tabs)/resources")}
            activeOpacity={0.85}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#FEF3C7" }]}>
              <Bookmark color="#D97706" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Bookmarks</Text>
          </TouchableOpacity>
        </View>
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
  gridSection: {
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  suiteCard: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  suiteIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  suiteTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  styledHeadingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headingAccentBar: {
    width: 4,
    height: 16,
    backgroundColor: "#2563EB",
    borderRadius: 2,
    marginRight: 10,
  },
  styledHeadingText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E40AF",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
    marginTop: 16,
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
