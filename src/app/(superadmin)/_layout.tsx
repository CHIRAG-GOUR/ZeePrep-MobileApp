import React from "react";
import { Tabs } from "expo-router";
import { ShieldAlert, Users, Layers, TrendingUp, User } from "lucide-react-native";
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
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size || 20} />,
        }}
      />

      <Tabs.Screen
        name="user-approval"
        options={{
          title: "Approvals",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size || 20} />,
        }}
      />

      <Tabs.Screen
        name="academic-hierarchy"
        options={{
          title: "Hierarchy",
          tabBarIcon: ({ color, size }) => <Layers color={color} size={size || 20} />,
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size || 20} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size || 20} />,
        }}
      />

      {/* Auxiliary & Sub-screens Accessible via Dashboard Grid / Headers */}
      <Tabs.Screen
        name="audit-logs"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="submissions"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="question-bank"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="exams"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
