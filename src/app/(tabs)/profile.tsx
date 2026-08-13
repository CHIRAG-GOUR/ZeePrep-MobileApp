import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ZEEPREP_THEME } from "../../constants/theme";
import { GraduationCap, LogOut, ChevronRight, BookOpen, ShieldCheck } from "lucide-react-native";
import { useResponsive } from "../../hooks/useResponsive";

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const responsive = useResponsive();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of ZeePrep Mobile?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (e) {
            console.error("Firebase SignOut error:", e);
          }
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(responsive.safeTop, 24) }]}>
      {/* Digital Student ID Badge Card (Task 15) */}
      <View style={styles.idCardContainer}>
        <View style={styles.idCardHeader}>
          <View style={styles.idCardHeaderLeft}>
            <ShieldCheck size={20} color="#4F46E5" />
            <Text style={styles.idCardInstitution}>{user?.schoolName || "ZeePrep Institutional Academy"}</Text>
          </View>
          <View style={styles.idBadgePill}>
            <Text style={styles.idBadgeText}>OFFICIAL STUDENT ID</Text>
          </View>
        </View>

        <View style={styles.idBodyRow}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || "S"}</Text>
          </View>

          <View style={styles.idMainInfo}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || "Student User"}</Text>
            <Text style={styles.idNumberText}>ID: {user?.loginId || "ZP-STU-10293"}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        {/* Academic Details Grid */}
        <View style={styles.idDetailsGrid}>
          <View style={styles.idDetailItem}>
            <Text style={styles.idDetailLabel}>Grade</Text>
            <Text style={styles.idDetailVal}>Grade {user?.grade || "10"}</Text>
          </View>

          <View style={styles.idDetailItem}>
            <Text style={styles.idDetailLabel}>Section</Text>
            <Text style={styles.idDetailVal}>Section {user?.section || "A"}</Text>
          </View>

          <View style={styles.idDetailItem}>
            <Text style={styles.idDetailLabel}>Board</Text>
            <Text style={styles.idDetailVal}>{user?.board || "CBSE"}</Text>
          </View>

          <View style={styles.idDetailItem}>
            <Text style={styles.idDetailLabel}>Stream</Text>
            <Text style={styles.idDetailVal}>{user?.stream || "Science"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account & Portal Operations</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={20} color={ZEEPREP_THEME.colors.error} />
          <Text style={styles.logoutBtnText}>Sign Out of Student Account</Text>
          <ChevronRight size={18} color={ZEEPREP_THEME.colors.error} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  idCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 24,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  idCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  idCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  idCardInstitution: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  idBadgePill: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  idBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: 0.5,
  },
  idBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  idMainInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  idNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  idDetailsGrid: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  idDetailItem: {
    alignItems: "center",
    flex: 1,
  },
  idDetailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  idDetailVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: ZEEPREP_THEME.colors.errorLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.error,
  },
});
