import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useAuthStore } from "../../stores/auth-store";
import { getPlatformMetrics } from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import { ShieldCheck, Users, UserCheck, FileCheck, Award, Layers, FolderKanban, HelpCircle, FileBarChart, User as UserIcon, Activity } from "lucide-react-native";
import { useRouter } from "expo-router";
import { AdminStatTile } from "../../components/AdminStatTile";
import SuperAdminRoleSwitcher from "../../components/SuperAdminRoleSwitcher";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();

  const isSmall = width < 360;
  const isLarge = width >= 600;
  const hPadding = isSmall ? 24 : isLarge ? 48 : 40;
  const columns = isSmall ? 2 : isLarge ? 4 : 3;
  const suiteItemWidth = Math.floor((width - hPadding - (columns - 1) * 10) / columns);
  const metricWidth = Math.floor((width - hPadding - 10) / (isLarge ? 4 : 2));

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    studentCount: 0,
    teacherCount: 0,
    adminCount: 0,
    totalExams: 0,
    totalReports: 0,
    totalResources: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await getPlatformMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Error loading admin metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isDesktopWeb && { maxWidth: 1280, alignSelf: "center", width: "100%", paddingHorizontal: 32, paddingTop: 24 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={ZEEPREP_THEME.colors.primary}
        />
      }
    >
      <SuperAdminRoleSwitcher />

      {/* Admin Header Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.badgeRow}>
          <ShieldCheck size={16} color={ZEEPREP_THEME.colors.primary} />
          <Text style={styles.roleBadge}>ADMINISTRATIVE CONTROL CENTER</Text>
        </View>
        <Text style={styles.userName}>{user?.name || "Administrator"}</Text>
        <Text style={styles.academicMeta}>Institutional User Governance & Portal Operations</Text>
      </View>

      {/* Admin Feature Suite */}
      <View style={styles.styledHeadingBox}>
        <View style={styles.headingAccentBar} />
        <Text style={styles.styledHeadingText}>Admin Feature Suite</Text>
      </View>
      <View style={styles.gridSection}>
        {/* Row 1 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(admin)/user-management" as any)}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#FEF3C7" }]}>
              <Users color="#D97706" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>User Control</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(admin)/reports" as any)}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#ECFDF5" }]}>
              <FileBarChart color="#059669" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(admin)/question-bank" as any)}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#EEF2FF" }]}>
              <HelpCircle color="#4F46E5" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Question Bank</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(admin)/resources" as any)}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#E0E7FF" }]}>
              <FolderKanban color="#4F46E5" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Resources</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(admin)/academic-hierarchy" as any)}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#F3E8FF" }]}>
              <Layers color="#7C3AED" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Hierarchy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(admin)/profile" as any)}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#F1F5F9" }]}>
              <UserIcon color="#475569" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Platform Statistics (Explicit 3-Column Grid) */}
      <Text style={styles.sectionTitle}>Platform Statistics</Text>

      {loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginVertical: 30 }} />
      ) : (
        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            <AdminStatTile
              icon={<Users color={ZEEPREP_THEME.colors.primary} size={18} />}
              value={metrics.studentCount}
              label="STUDENTS"
              iconBgColor="#EEF2FF"
              accessibilityLabel={`${metrics.studentCount} Active Students`}
            />

            <AdminStatTile
              icon={<UserCheck color="#059669" size={18} />}
              value={metrics.teacherCount}
              label="FACULTY"
              iconBgColor="#ECFDF5"
              accessibilityLabel={`${metrics.teacherCount} Faculty Members`}
            />

            <AdminStatTile
              icon={<FileCheck color="#D97706" size={18} />}
              value={metrics.totalExams}
              label="ASSESSMENTS"
              iconBgColor="#FEF3C7"
              accessibilityLabel={`${metrics.totalExams} Total Assessments`}
            />
          </View>

          <View style={styles.gridRow}>
            <AdminStatTile
              icon={<Award color="#7C3AED" size={18} />}
              value={metrics.totalReports}
              label="SCORECARDS"
              iconBgColor="#F3E8FF"
              accessibilityLabel={`${metrics.totalReports} Student Scorecards`}
            />

            <AdminStatTile
              icon={<Activity color="#16A34A" size={18} />}
              value="HEALTHY"
              label="STATUS"
              iconBgColor="#F0FDF4"
              accessibilityLabel="Platform Status Healthy"
              isSmallText={true}
            />

            <AdminStatTile
              icon={<ShieldCheck color="#0284C7" size={18} />}
              value="92%"
              label="PASS RATIO"
              iconBgColor="#F0F9FF"
              accessibilityLabel="92 Percent Pass Ratio"
            />
          </View>
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
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  roleBadge: {
    color: ZEEPREP_THEME.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  academicMeta: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
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
});
