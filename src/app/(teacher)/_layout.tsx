import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Activity,
  HelpCircle,
  FileCheck,
  User,
} from "lucide-react-native";
import { Platform } from "react-native";
import { ZEEPREP_THEME } from "../../constants/theme";

export default function TeacherTabsLayout() {
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
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size || 20} />,
        }}
      />

      {/* 2. Live Monitor */}
      <Tabs.Screen
        name="submissions"
        options={{
          title: "Live Monitor",
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size || 20} />,
        }}
      />

      {/* 3. Question Bank */}
      <Tabs.Screen
        name="question-bank"
        options={{
          title: "Question Bank",
          tabBarIcon: ({ color, size }) => <HelpCircle color={color} size={size || 20} />,
        }}
      />

      {/* 4. Exams */}
      <Tabs.Screen
        name="exams"
        options={{
          title: "Exams",
          tabBarIcon: ({ color, size }) => <FileCheck color={color} size={size || 20} />,
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size || 20} />,
        }}
      />

      {/* Secondary Sub-screens Hidden from Bottom Tab Bar */}
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

      <Tabs.Screen
        name="exam-builder"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="questions"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="roster"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
