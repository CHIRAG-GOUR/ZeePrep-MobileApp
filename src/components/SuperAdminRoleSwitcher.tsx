import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore, isSuperAdminUser, ViewMode } from "../stores/auth-store";
import { ZEEPREP_THEME } from "../constants/theme";
import { Crown, ChevronDown, ShieldAlert, ShieldCheck, GraduationCap, UserCheck, Check } from "lucide-react-native";

export default function SuperAdminRoleSwitcher() {
  const router = useRouter();
  const { user, viewMode, setViewMode } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);

  if (!user || !isSuperAdminUser(user)) {
    return null;
  }

  const currentMode = viewMode || "superadmin";

  const handleSelectRole = (targetMode: ViewMode) => {
    setViewMode(targetMode);
    setModalVisible(false);

    if (targetMode === "superadmin") {
      router.push("/(superadmin)");
    } else if (targetMode === "admin") {
      router.push("/(admin)");
    } else if (targetMode === "teacher") {
      router.push("/(teacher)");
    } else {
      router.push("/(tabs)");
    }
  };

  const getLabel = (mode: ViewMode) => {
    switch (mode) {
      case "superadmin":
        return "Super Admin Portal";
      case "admin":
        return "Admin Control Portal";
      case "teacher":
        return "Faculty / Teacher Portal";
      case "student":
        return "Student Portal";
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.switcherButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.badgeLeft}>
          <Crown size={14} color="#4F46E5" />
          <Text style={styles.viewModeTag}>SUPER ADMIN VIEW:</Text>
        </View>

        <View style={styles.selectedPill}>
          <Text style={styles.selectedLabel}>{getLabel(currentMode)}</Text>
          <ChevronDown size={14} color="#4F46E5" />
        </View>
      </TouchableOpacity>

      {/* Role Picker Dropdown Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <View style={styles.dropdownCard}>
            <View style={styles.dropdownHeader}>
              <Crown size={18} color="#4F46E5" />
              <Text style={styles.dropdownTitle}>Switch Portal View</Text>
            </View>
            <Text style={styles.dropdownSub}>
              Super Admin Override — Switch active interface role
            </Text>

            <TouchableOpacity
              style={[styles.roleOption, currentMode === "superadmin" && styles.roleOptionActive]}
              onPress={() => handleSelectRole("superadmin")}
            >
              <View style={styles.optionLeft}>
                <ShieldAlert size={18} color={currentMode === "superadmin" ? "#4F46E5" : "#64748B"} />
                <View>
                  <Text style={[styles.optionTitle, currentMode === "superadmin" && styles.optionTitleActive]}>
                    Super Admin
                  </Text>
                  <Text style={styles.optionSub}>Control center, governance & approvals</Text>
                </View>
              </View>
              {currentMode === "superadmin" ? <Check size={18} color="#4F46E5" /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, currentMode === "admin" && styles.roleOptionActive]}
              onPress={() => handleSelectRole("admin")}
            >
              <View style={styles.optionLeft}>
                <ShieldCheck size={18} color={currentMode === "admin" ? "#4F46E5" : "#64748B"} />
                <View>
                  <Text style={[styles.optionTitle, currentMode === "admin" && styles.optionTitleActive]}>
                    Admin
                  </Text>
                  <Text style={styles.optionSub}>Institutional management & analytics</Text>
                </View>
              </View>
              {currentMode === "admin" ? <Check size={18} color="#4F46E5" /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, currentMode === "teacher" && styles.roleOptionActive]}
              onPress={() => handleSelectRole("teacher")}
            >
              <View style={styles.optionLeft}>
                <UserCheck size={18} color={currentMode === "teacher" ? "#4F46E5" : "#64748B"} />
                <View>
                  <Text style={[styles.optionTitle, currentMode === "teacher" && styles.optionTitleActive]}>
                    Teacher / Faculty
                  </Text>
                  <Text style={styles.optionSub}>Question bank, creator & submissions</Text>
                </View>
              </View>
              {currentMode === "teacher" ? <Check size={18} color="#4F46E5" /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOption, currentMode === "student" && styles.roleOptionActive]}
              onPress={() => handleSelectRole("student")}
            >
              <View style={styles.optionLeft}>
                <GraduationCap size={18} color={currentMode === "student" ? "#4F46E5" : "#64748B"} />
                <View>
                  <Text style={[styles.optionTitle, currentMode === "student" && styles.optionTitleActive]}>
                    Student
                  </Text>
                  <Text style={styles.optionSub}>Assigned exams, AI tutor & scorecards</Text>
                </View>
              </View>
              {currentMode === "student" ? <Check size={18} color="#4F46E5" /> : null}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  switcherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  badgeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewModeTag: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4338CA",
    letterSpacing: 0.5,
  },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A5B4FC",
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3730A3",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  dropdownSub: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
  },
  roleOptionActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#A5B4FC",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  optionTitleActive: {
    color: "#4338CA",
    fontWeight: "800",
  },
  optionSub: {
    fontSize: 11,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 1,
  },
});
