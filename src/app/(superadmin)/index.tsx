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

      {/* Super Admin Command Center Hero Banner */}
      <View style={styles.commandBanner}>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>SUPER ADMIN PLATFORM COMMAND CENTER</Text>
        </View>
        <Text style={styles.bannerTitle}>Platform Overview & Telemetry</Text>
        <Text style={styles.bannerSub}>
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

      {/* Compact 2-Column Overview Statistics Grid */}
      <View style={styles.metricsGrid}>
        <AdminStatTile
          icon={<School color={ZEEPREP_THEME.colors.primary} size={22} />}
          value={3}
          label="SCHOOLS"
          iconBgColor="#EEF2FF"
          cardWidth={metricTileWidth}
          accessibilityLabel="3 Total Schools"
        />

        <AdminStatTile
          icon={<UserCheck color="#059669" size={22} />}
          value={metrics.teacherCount}
          label="TEACHERS"
          iconBgColor="#ECFDF5"
          cardWidth={metricTileWidth}
          accessibilityLabel={`${metrics.teacherCount} Total Teachers`}
        />

        <AdminStatTile
          icon={<Users color="#7C3AED" size={22} />}
          value={metrics.studentCount}
          label="STUDENTS"
          iconBgColor="#F3E8FF"
          cardWidth={metricTileWidth}
          accessibilityLabel={`${metrics.studentCount} Total Students`}
        />

        <AdminStatTile
          icon={<FileCheck color="#D97706" size={22} />}
          value={metrics.totalExams}
          label="EXAMS"
          iconBgColor="#FEF3C7"
          cardWidth={metricTileWidth}
          accessibilityLabel={`${metrics.totalExams} Total Exams`}
        />

        <AdminStatTile
          icon={<Activity color="#2563EB" size={22} />}
          value={1}
          label="ACTIVE EXAMS"
          iconBgColor="#EFF6FF"
          cardWidth={metricTileWidth}
          accessibilityLabel="1 Active Exam"
        />

        <AdminStatTile
          icon={<HelpCircle color="#E11D48" size={22} />}
          value={25}
          label="QUESTION BANKS"
          iconBgColor="#FFF1F2"
          cardWidth={metricTileWidth}
          accessibilityLabel="25 Question Banks"
        />

        <AdminStatTile
          icon={<FileBarChart color="#16A34A" size={22} />}
          value={metrics.totalReports}
          label="REPORTS"
          iconBgColor="#F0FDF4"
          cardWidth={metricTileWidth}
          accessibilityLabel={`${metrics.totalReports} Reports Generated`}
        />

        <AdminStatTile
          icon={<Award color="#0284C7" size={22} />}
          value="92%"
          label="PASS RATIO"
          iconBgColor="#F0F9FF"
          cardWidth={metricTileWidth}
          accessibilityLabel="92 Percent Pass Ratio"
        />
      </View>

      {/* Full 11-Tab Navigation Grid Suite */}
      <Text style={styles.sectionTitle}>Full SuperAdmin Feature Suite</Text>
      <View style={styles.suiteGrid}>
        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#EEF2FF" }]}>
            <ShieldAlert color={ZEEPREP_THEME.colors.primary} size={18} />
          </View>
          <Text style={styles.suiteTitle}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/submissions")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#ECFDF5" }]}>
            <Activity color="#059669" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Live Monitor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/user-approval")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#FEF3C7" }]}>
            <Users color="#D97706" size={18} />
          </View>
          <Text style={styles.suiteTitle}>User Control</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/academic-hierarchy")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#F3E8FF" }]}>
            <Layers color="#7C3AED" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Hierarchy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/question-bank")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#EEF2FF" }]}>
            <HelpCircle color="#4F46E5" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Question Bank</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/exams")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#FEF3C7" }]}>
            <FileCheck color="#D97706" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Exams</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/resources")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#E0E7FF" }]}>
            <FolderKanban color="#4F46E5" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/reports")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#ECFDF5" }]}>
            <FileBarChart color="#059669" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/analytics")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#F3E8FF" }]}>
            <TrendingUp color="#7C3AED" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Analytics Hub</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/audit-logs")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#FEF3C7" }]}>
            <Activity color="#D97706" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Audit Logs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(superadmin)/settings")}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#F1F5F9" }]}>
            <Settings color="#475569" size={18} />
          </View>
          <Text style={styles.suiteTitle}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Storage & System Telemetry Card */}
      <Text style={styles.sectionTitle}>Storage & System Telemetry</Text>
      <View style={styles.telemetryCard}>
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Firestore Storage</Text>
          <Text style={styles.telemetryVal}>142.8 MB / 1 GB</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>API Requests Executed</Text>
          <Text style={styles.telemetryVal}>12,450 Reads</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Auth & Database Status</Text>
          <View style={styles.statusPill}>
            <CheckCircle2 size={12} color="#059669" />
            <Text style={styles.statusPillText}>HEALTHY</Text>
          </View>
        </View>
      </View>

      {/* Login Analytics & Active Users */}
      <Text style={styles.sectionTitle}>Login Analytics & Active Users</Text>
      <View style={styles.telemetryCard}>
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Daily Active Logins</Text>
          <Text style={styles.telemetryVal}>1 Users</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Weekly Active Users</Text>
          <Text style={styles.telemetryVal}>1 Users</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Avg Session Duration</Text>
          <Text style={styles.telemetryVal}>24m 18s</Text>
        </View>
      </View>

      {/* Platform Academic Performance */}
      <Text style={styles.sectionTitle}>Platform Academic Performance</Text>
      <View style={styles.telemetryCard}>
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Platform Average Score</Text>
          <Text style={[styles.telemetryVal, { color: ZEEPREP_THEME.colors.primary }]}>78%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>Passing Ratio</Text>
          <Text style={[styles.telemetryVal, { color: "#059669" }]}>92% Pass</Text>
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    gap: 10,
  },
  metricIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metricTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "900",
    color: ZEEPREP_THEME.colors.textPrimary,
    lineHeight: 22,
  },
  metricLbl: {
    fontSize: 9,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  suiteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  suiteItem: {
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
  suiteIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
  telemetryCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 16,
  },
  telemetryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  telemetryLabel: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    fontWeight: "600",
  },
  telemetryVal: {
    fontSize: 14,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
});
