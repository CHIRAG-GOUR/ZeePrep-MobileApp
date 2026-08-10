import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { getPendingTeacherApprovals, updateUserAccountStatus, getAllUsers } from "../../services/firestore";
import { useAuthStore } from "../../stores/auth-store";
import type { User } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { UserCheck, CheckCircle2, XCircle, Clock, ShieldCheck } from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";

export default function UserApprovalScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const [pendingTeachers, setPendingTeachers] = useState<User[]>([]);
  const [allTeachers, setAllTeachers] = useState<User[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"pending" | "approved">("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const [pendingList, teachersList] = await Promise.all([
        getPendingTeacherApprovals(),
        getAllUsers("teacher"),
      ]);
      setPendingTeachers(pendingList);
      setAllTeachers(teachersList.filter((t) => t.status === "active"));
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApprovals();
  };

  const handleApprove = async (teacher: User) => {
    try {
      const ok = await updateUserAccountStatus(teacher.uid, "active", "approved", currentUser || undefined);
      if (ok) {
        setPendingTeachers((prev) => prev.filter((t) => t.uid !== teacher.uid));
        setAllTeachers((prev) => [{ ...teacher, status: "active", approvalStatus: "approved" }, ...prev]);
        Alert.alert("Teacher Approved", `${teacher.name || teacher.email} has been granted faculty portal access.`);
      } else {
        Alert.alert("Error", "Failed to approve faculty account.");
      }
    } catch (err) {
      console.error("Error approving teacher:", err);
    }
  };

  const handleReject = async (teacher: User) => {
    try {
      const ok = await updateUserAccountStatus(teacher.uid, "rejected", "rejected", currentUser || undefined);
      if (ok) {
        setPendingTeachers((prev) => prev.filter((t) => t.uid !== teacher.uid));
        Alert.alert("Teacher Rejected", `${teacher.name || teacher.email} access request has been rejected.`);
      } else {
        Alert.alert("Error", "Failed to reject faculty account.");
      }
    } catch (err) {
      console.error("Error rejecting teacher:", err);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Faculty Verification"
        subtitle="Review external domain teacher requests"
        fallbackRoute="/(superadmin)"
      />

      <View style={styles.subTabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeSubTab === "pending" && styles.tabActive]}
            onPress={() => setActiveSubTab("pending")}
          >
            <Text style={[styles.tabText, activeSubTab === "pending" && styles.tabTextActive]}>
              Pending ({pendingTeachers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeSubTab === "approved" && styles.tabActive]}
            onPress={() => setActiveSubTab("approved")}
          >
            <Text style={[styles.tabText, activeSubTab === "approved" && styles.tabTextActive]}>
              Approved ({allTeachers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ZEEPREP_THEME.colors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
        ) : activeSubTab === "pending" ? (
          pendingTeachers.length > 0 ? (
            pendingTeachers.map((t) => (
              <View key={t.uid} style={styles.card}>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.teacherName}>{t.name || "Faculty Applicant"}</Text>
                    <View style={styles.pendingBadge}>
                      <Clock size={12} color="#D97706" />
                      <Text style={styles.pendingBadgeText}>PENDING</Text>
                    </View>
                  </View>
                  <Text style={styles.teacherEmail}>{t.email}</Text>
                  <Text style={styles.teacherMeta}>
                    Subject: {t.subject || "General Science"} • Grade {t.grade || "N/A"}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(t)}
                  >
                    <XCircle size={16} color="#DC2626" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(t)}
                  >
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.approveBtnText}>Approve Access</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <UserCheck size={36} color={ZEEPREP_THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No Pending Requests</Text>
              <Text style={styles.emptySub}>
                All faculty registration requests have been reviewed and verified.
              </Text>
            </View>
          )
        ) : (
          allTeachers.map((t) => (
            <View key={t.uid} style={styles.card}>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.teacherName}>{t.name}</Text>
                  <View style={styles.approvedBadge}>
                    <ShieldCheck size={12} color="#059669" />
                    <Text style={styles.approvedBadgeText}>APPROVED</Text>
                  </View>
                </View>
                <Text style={styles.teacherEmail}>{t.email}</Text>
                <Text style={styles.teacherMeta}>
                  Subject: {t.subject || "Faculty Member"} • Grade {t.grade || "N/A"}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  subTabBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  tabTextActive: {
    color: ZEEPREP_THEME.colors.primary,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
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
  cardInfo: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teacherName: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
  },
  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  approvedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  teacherEmail: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  teacherMeta: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textMuted,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    backgroundColor: ZEEPREP_THEME.colors.errorLight,
    borderRadius: 10,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.error,
  },
  approveBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 10,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
  },
});
