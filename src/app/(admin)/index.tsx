import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "../../stores/auth-store";
import { getPlatformMetrics } from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import { ShieldCheck, Users, UserCheck, FileCheck, Award } from "lucide-react-native";

import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Layers, FolderKanban, HelpCircle, FileBarChart } from "lucide-react-native";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

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
          style={styles.suiteItem}
          onPress={() => router.push("/(admin)/user-management" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#FEF3C7" }]}>
            <Users color="#D97706" size={20} />
          </View>
          <Text style={styles.suiteTitle}>User Control</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.suiteItem}
          onPress={() => router.push("/(admin)/reports" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#ECFDF5" }]}>
            <FileBarChart color="#059669" size={20} />
          </View>
          <Text style={styles.suiteTitle}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.suiteItem}
          onPress={() => router.push("/(teacher)/question-bank" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#EEF2FF" }]}>
            <HelpCircle color="#4F46E5" size={20} />
          </View>
          <Text style={styles.suiteTitle}>Question Bank</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.suiteItem}
          onPress={() => router.push("/(teacher)/resources" as any)}
        >
          <View style={[styles.suiteIcon, { backgroundColor: "#E0E7FF" }]}>
            <FolderKanban color="#4F46E5" size={20} />
          </View>
          <Text style={styles.suiteTitle}>Resources</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.suiteItem}
          onPress={() => router.push("/(superadmin)/academic-hierarchy" as any)}
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
          <View style={styles.metricCard}>
            <Users color={ZEEPREP_THEME.colors.primary} size={24} />
            <Text style={styles.metricVal}>{metrics.studentCount}</Text>
            <Text style={styles.metricLbl}>Active Students</Text>
          </View>

          <View style={styles.metricCard}>
            <UserCheck color="#059669" size={24} />
            <Text style={styles.metricVal}>{metrics.teacherCount}</Text>
            <Text style={styles.metricLbl}>Faculty Members</Text>
          </View>

          <View style={styles.metricCard}>
            <FileCheck color="#D97706" size={24} />
            <Text style={styles.metricVal}>{metrics.totalExams}</Text>
            <Text style={styles.metricLbl}>Total Assessments</Text>
          </View>

          <View style={styles.metricCard}>
            <Award color="#7C3AED" size={24} />
            <Text style={styles.metricVal}>{metrics.totalReports}</Text>
            <Text style={styles.metricLbl}>Student Scorecards</Text>
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
    width: "48%",
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
  metricVal: {
    fontSize: 24,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 8,
  },
  metricLbl: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
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
