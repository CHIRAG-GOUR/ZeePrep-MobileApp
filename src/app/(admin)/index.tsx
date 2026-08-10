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
} from "react-native";
import { useAuthStore } from "../../stores/auth-store";
import { getPlatformMetrics } from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import { ShieldCheck, Users, UserCheck, FileCheck, Award, Layers, FolderKanban, HelpCircle, FileBarChart } from "lucide-react-native";
import { useRouter } from "expo-router";

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
      <Text style={styles.sectionTitle}>Admin Feature Suite</Text>
      <View style={styles.suiteGrid}>
        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(admin)/user-management" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#FEF3C7" }]}>
            <Users color="#D97706" size={20} />
          </View>
          <Text style={styles.suiteTitle}>User Control</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(admin)/reports" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#ECFDF5" }]}>
            <FileBarChart color="#059669" size={20} />
          </View>
          <Text style={styles.suiteTitle}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(admin)/question-bank" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#EEF2FF" }]}>
            <HelpCircle color="#4F46E5" size={20} />
          </View>
          <Text style={styles.suiteTitle}>Question Bank</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(admin)/resources" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#E0E7FF" }]}>
            <FolderKanban color="#4F46E5" size={20} />
          </View>
          <Text style={styles.suiteTitle}>Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suiteItem, { width: suiteItemWidth }]}
          onPress={() => router.push("/(admin)/academic-hierarchy" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#F3E8FF" }]}>
            <Layers color="#7C3AED" size={20} />
          </View>
          <Text style={styles.suiteTitle}>Hierarchy</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Platform Statistics</Text>

      {loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginVertical: 30 }} />
      ) : (
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { width: metricWidth }]}>
            <View style={[styles.metricIconBox, { backgroundColor: "#EEF2FF" }]}>
              <Users color={ZEEPREP_THEME.colors.primary} size={20} />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={styles.metricVal}>{metrics.studentCount}</Text>
              <Text style={styles.metricLbl} numberOfLines={1}>STUDENTS</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { width: metricWidth }]}>
            <View style={[styles.metricIconBox, { backgroundColor: "#ECFDF5" }]}>
              <UserCheck color="#059669" size={20} />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={styles.metricVal}>{metrics.teacherCount}</Text>
              <Text style={styles.metricLbl} numberOfLines={1}>FACULTY</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { width: metricWidth }]}>
            <View style={[styles.metricIconBox, { backgroundColor: "#FEF3C7" }]}>
              <FileCheck color="#D97706" size={20} />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={styles.metricVal}>{metrics.totalExams}</Text>
              <Text style={styles.metricLbl} numberOfLines={1}>ASSESSMENTS</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { width: metricWidth }]}>
            <View style={[styles.metricIconBox, { backgroundColor: "#F3E8FF" }]}>
              <Award color="#7C3AED" size={20} />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={styles.metricVal}>{metrics.totalReports}</Text>
              <Text style={styles.metricLbl} numberOfLines={1}>SCORECARDS</Text>
            </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
});
