import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../stores/auth-store";
import { View, ActivityIndicator } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initAuthListener } from "../services/auth";
import { ZEEPREP_THEME } from "../constants/theme";

import { MobileWebShell } from "../components/MobileWebShell";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inSuperAdminGroup = segments[0] === "(superadmin)";
    const inAdminGroup = segments[0] === "(admin)";
    const inTeacherGroup = segments[0] === "(teacher)";
    const inStudentGroup = segments[0] === "(tabs)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login" as any);
    } else if (isAuthenticated && user) {
      if (user.role === "superadmin" && !inSuperAdminGroup) {
        router.replace("/(superadmin)" as any);
      } else if (user.role === "admin" && !inAdminGroup) {
        router.replace("/(admin)" as any);
      } else if (user.role === "teacher" && !inTeacherGroup) {
        router.replace("/(teacher)" as any);
      } else if (user.role === "student" && !inStudentGroup && inAuthGroup) {
        router.replace("/(tabs)" as any);
      }
    }
  }, [isAuthenticated, isLoading, user, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: ZEEPREP_THEME.colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MobileWebShell>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(superadmin)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="exam/[id]" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="results/[id]" />
        </Stack>
      </MobileWebShell>
    </QueryClientProvider>
  );
}
