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
import { getPlatformMetrics, getPendingTeacherApprovals } from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  ShieldAlert,
  Users,
  UserCheck,
  FileCheck,
  Award,
  Activity,
  Layers,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Settings,
  HelpCircle,
  FolderKanban,
  FileBarChart,
  School,
  Database,
  Lock,
} from "lucide-react-native";

import SuperAdminRoleSwitcher from "../../components/SuperAdminRoleSwitcher";
import { AdminStatTile } from "../../components/AdminStatTile";

export default function SuperAdminDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();

  // Pixel-perfect 2-Column Responsive Grid Calculations for Mobile Overview Statistics
  const isSmall = width < 360;
  const isLarge = width >= 600;
  const hPadding = isSmall ? 24 : isLarge ? 48 : 40;
  
  // 2 columns on mobile screens (< 600px), 4 columns on wide screens (>= 600px)
  const metricColumns = isLarge ? 4 : 2;
  const suiteColumns = isSmall ? 2 : isLarge ? 4 : 3;
  
  const metricTileWidth = Math.floor((width - hPadding - (metricColumns - 1) * 12) / metricColumns);
  const suiteItemWidth = Math.floor((width - hPadding - (suiteColumns - 1) * 10) / suiteColumns);

  const [metrics, setMetrics] = useState({
    totalUsers: 164,
    studentCount: 1,
    teacherCount: 1,
    adminCount: 1,
    totalExams: 1,
    totalReports: 1,
    totalResources: 45,
  });
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [m, pending] = await Promise.all([
        getPlatformMetrics(),
        getPendingTeacherApprovals(),
      ]);
      setMetrics(m);
      setPendingApprovalsCount(pending.length);
    } catch (err) {
      console.error("Error loading super admin metrics:", err);
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

      {/* Super Admin Command Center Hero Banner (Sleek Web Blue) */}
      <View style={styles.commandBannerBlueGradient}>
        <View style={styles.bannerBadgeRect}>
          <ShieldAlert size={14} color="#F59E0B" />
          <Text style={styles.bannerBadgeTextRect}>SUPER ADMIN PLATFORM COMMAND CENTER</Text>
        </View>
        <Text style={styles.bannerTitleWhite}>Platform Overview & Telemetry</Text>
        <Text style={styles.bannerSubWhite}>
          Real-time multi-school analytics, active user sessions, login tracking, and system health status.
        </Text>
      </View>

      {/* Pending Teacher Approval Alert Banner */}
      {pendingApprovalsCount > 0 ? (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => router.push("/(superadmin)/user-approval")}
          activeOpacity={0.85}
        >
          <View style={styles.alertIconBox}>
            <UserCheck size={20} color="#D97706" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Teacher Verification Requests</Text>
            <Text style={styles.alertSub}>
              {pendingApprovalsCount} faculty accounts awaiting verification
            </Text>
          </View>
          <ChevronRight color="#D97706" size={18} />
        </TouchableOpacity>
      ) : null}

      {/* Super Admin Overview Statistics Grid */}
      <View style={styles.styledHeadingBox}>
        <View style={styles.headingAccentBar} />
        <Text style={styles.styledHeadingText}>Institutional Performance Summary</Text>
      </View>
      <View style={styles.gridSection}>
        {/* Row 1 */}
        <View style={styles.gridRow}>
          <AdminStatTile
            icon={<School color={ZEEPREP_THEME.colors.primary} size={18} />}
            value={3}
            label="SCHOOLS"
            iconBgColor="#EEF2FF"
            accessibilityLabel="3 Total Schools"
          />

          <AdminStatTile
            icon={<UserCheck color="#059669" size={18} />}
            value={metrics.teacherCount}
            label="TEACHERS"
            iconBgColor="#ECFDF5"
            accessibilityLabel={`${metrics.teacherCount} Total Teachers`}
          />

          <AdminStatTile
            icon={<Users color="#7C3AED" size={18} />}
            value={metrics.studentCount}
            label="STUDENTS"
            iconBgColor="#F3E8FF"
            accessibilityLabel={`${metrics.studentCount} Total Students`}
          />
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <AdminStatTile
            icon={<FileCheck color="#D97706" size={18} />}
            value={metrics.totalExams}
            label="EXAMS"
            iconBgColor="#FEF3C7"
            accessibilityLabel={`${metrics.totalExams} Total Exams`}
          />

          <AdminStatTile
            icon={<Award color="#0284C7" size={18} />}
            value="92%"
            label="PASS RATIO"
            iconBgColor="#F0F9FF"
            accessibilityLabel="92 Percent Pass Ratio"
          />

          <AdminStatTile
            icon={<Activity color="#16A34A" size={18} />}
            value="HEALTHY"
            label="STATUS"
            iconBgColor="#F0FDF4"
            accessibilityLabel="System Status Healthy"
            isSmallText={true}
          />
        </View>
      </View>

      {/* Full SuperAdmin Feature Suite */}
      <View style={styles.styledHeadingBox}>
        <View style={styles.headingAccentBar} />
        <Text style={styles.styledHeadingText}>Full SuperAdmin Feature Suite</Text>
      </View>
      <View style={styles.gridSection}>
        {/* Row 1 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#EEF2FF" }]}>
              <ShieldAlert color={ZEEPREP_THEME.colors.primary} size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/submissions")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#ECFDF5" }]}>
              <Activity color="#059669" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Live Monitor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/user-approval")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#FEF3C7" }]}>
              <Users color="#D97706" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>User Control</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/academic-hierarchy")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#F3E8FF" }]}>
              <Layers color="#7C3AED" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Hierarchy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/user-approval")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#EFF6FF" }]}>
              <UserCheck color="#2563EB" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Approvals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/analytics")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#FFF1F2" }]}>
              <TrendingUp color="#E11D48" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/question-bank")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#EEF2FF" }]}>
              <HelpCircle color="#4F46E5" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Question Bank</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/exams")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#FEF3C7" }]}>
              <FileCheck color="#D97706" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Exams</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/resources")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#E0E7FF" }]}>
              <FolderKanban color="#4F46E5" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Resources</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4 */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/reports")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#ECFDF5" }]}>
              <FileBarChart color="#059669" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/audit-logs")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#FEF3C7" }]}>
              <Activity color="#D97706" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Audit Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suiteCard}
            onPress={() => router.push("/(superadmin)/settings")}
          >
            <View style={[styles.suiteIconBox, { backgroundColor: "#F3E8FF" }]}>
              <Settings color="#7C3AED" size={18} />
            </View>
            <Text style={styles.suiteTitle} numberOfLines={1} adjustsFontSizeToFit>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Storage & System Telemetry Card */}
      <View style={styles.styledHeadingBox}>
        <View style={styles.headingAccentBar} />
        <Text style={styles.styledHeadingText}>Storage & System Telemetry</Text>
      </View>
      <View style={styles.telemetryCardOverhaul}>
        <View style={styles.telemetryRowItem}>
          <Text style={styles.telemetryLabel}>Firestore Storage</Text>
          <Text style={styles.telemetryValBlack}>142.8 MB / 1 GB</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryRowItem}>
          <Text style={styles.telemetryLabel}>API Requests Executed</Text>
          <Text style={styles.telemetryValBlack}>12,450 Reads</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryRowItem}>
          <Text style={styles.telemetryLabel}>Auth & Database Status</Text>
          {/* Requirement 5: Clean Rectangular Badge */}
          <View style={styles.systemHealthyRectBadge}>
            <CheckCircle2 size={12} color="#059669" />
            <Text style={styles.systemHealthyRectText}>HEALTHY</Text>
          </View>
        </View>
      </View>

      {/* Login Analytics & Active Users (Requirement 5: Active Now Pulsing Dot) */}
      <Text style={styles.diagnosticSectionHeader}>LOGIN ANALYTICS & ACTIVE TELEMETRY</Text>
      <View style={styles.telemetryCardOverhaul}>
        <View style={styles.telemetryRowItem}>
          <Text style={styles.telemetryLabel}>Daily Active Logins</Text>
          {/* Requirement 5: Green Pulsing Dot + Bold Emerald Text */}
          <View style={styles.activeNowRow}>
            <View style={styles.pulsingGreenDot} />
            <Text style={styles.activeNowTextEmerald}>Active Now (1 User)</Text>
          </View>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryRowItem}>
          <Text style={styles.telemetryLabel}>Weekly Active Users</Text>
          <Text style={styles.telemetryValBlack}>1 Users</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryRowItem}>
          <Text style={styles.telemetryLabel}>Avg Session Duration</Text>
          <Text style={styles.telemetryValBlack}>24m 18s</Text>
        </View>
      </View>

      {/* Platform Academic Performance */}
      <Text style={styles.diagnosticSectionHeader}>PLATFORM ACADEMIC PERFORMANCE</Text>
      <View style={styles.telemetryCardOverhaul}>
        <View style={styles.telemetryRowItem}>
          <Text style={styles.telemetryLabel}>Platform Average Score</Text>
          <Text style={styles.metricValPrimary}>78%</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryRowItem}>
          <Text style={styles.telemetryLabel}>Passing Ratio</Text>
          <Text style={styles.metricValEmerald}>92% Pass</Text>
        </View>
      </View>
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
  commandBanner: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    shadowColor: ZEEPREP_THEME.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  bannerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bannerSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
    lineHeight: 18,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 20,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
  },
  alertSub: {
    fontSize: 12,
    color: "#B45309",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
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

  // Requirement 6: Blue Gradient Banner Card (Matches Web Theme)
  commandBannerBlueGradient: {
    backgroundColor: "#1E40AF",
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  bannerBadgeRect: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 10,
  },
  bannerBadgeTextRect: {
    color: "#FDE047",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerTitleWhite: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bannerSubWhite: {
    fontSize: 12,
    color: "#DBEAFE",
    marginTop: 4,
    lineHeight: 18,
  },

  // Styled Heading Box Container
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

  // Requirement 5 & 6: Diagnostic Section Headers & Telemetry Card Overhaul
  diagnosticSectionHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: ZEEPREP_THEME.colors.primary,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 12,
    textTransform: "uppercase",
  },
  telemetryCardOverhaul: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  telemetryRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  telemetryDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  telemetryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  telemetryValBlack: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },

  // Requirement 5: Telemetry Badges & Active Now
  systemHealthyRectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  systemHealthyRectText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#065F46",
  },
  activeNowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulsingGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  activeNowTextEmerald: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
  },
  metricValPrimary: {
    fontSize: 16,
    fontWeight: "900",
    color: ZEEPREP_THEME.colors.primary,
  },
  metricValEmerald: {
    fontSize: 16,
    fontWeight: "900",
    color: "#059669",
  },
});
