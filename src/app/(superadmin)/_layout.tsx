import React from "react";
import { Tabs } from "expo-router";
import { ShieldAlert, Users, Layers, TrendingUp, Activity, Settings, User } from "lucide-react-native";
import { Platform } from "react-native";
import { ZEEPREP_THEME } from "../../constants/theme";

export default function SuperAdminTabsLayout() {
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
          fontSize: 9,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="user-approval"
        options={{
          title: "Approvals",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="academic-hierarchy"
        options={{
          title: "Hierarchy",
          tabBarIcon: ({ color, size }) => <Layers color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="audit-logs"
        options={{
          title: "Audit Logs",
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size || 18} />,
        }}
      />
    </Tabs>
  );
}
