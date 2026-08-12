import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ZEEPREP_THEME } from "../constants/theme";
import { useAuthStore } from "../stores/auth-store";

import SuperAdminRoleSwitcher from "./SuperAdminRoleSwitcher";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  fallbackRoute?: string;
  rightAction?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  showBack = true,
  fallbackRoute,
  rightAction,
}: AppHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (fallbackRoute) {
      router.replace(fallbackRoute as any);
      return;
    }

    // Role-aware fallback route so users stay in their exact portal
    if (user?.role === "superadmin") {
      router.replace("/(superadmin)" as any);
    } else if (user?.role === "admin") {
      router.replace("/(admin)" as any);
    } else if (user?.role === "teacher") {
      router.replace("/(teacher)" as any);
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  return (
    <View style={styles.header}>
      <SuperAdminRoleSwitcher />
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go Back"
          >
            <ArrowLeft size={20} color={ZEEPREP_THEME.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  rightAction: {
    marginLeft: 8,
  },
});
