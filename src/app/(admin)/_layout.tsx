import React from "react";
import { Tabs } from "expo-router";
import { ShieldCheck, Users, FileBarChart, User } from "lucide-react-native";
import { Platform } from "react-native";
import { ZEEPREP_THEME } from "../../constants/theme";

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ZEEPREP_THEME.colors.primary,
        tabBarInactiveTintColor: ZEEPREP_THEME.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: ZEEPREP_THEME.colors.surface,
          borderTopColor: ZEEPREP_THEME.colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size || 22} />,
        }}
      />

      <Tabs.Screen
        name="user-management"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size || 22} />,
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => <FileBarChart color={color} size={size || 22} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size || 22} />,
        }}
      />
    </Tabs>
  );
}
