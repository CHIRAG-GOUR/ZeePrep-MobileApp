import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  PlusCircle,
  HelpCircle,
  FileCheck,
  Activity,
  Users,
  FolderKanban,
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
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="question-bank"
        options={{
          title: "Item Bank",
          tabBarIcon: ({ color, size }) => <HelpCircle color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="exam-builder"
        options={{
          title: "Creator",
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="exams"
        options={{
          title: "Assessments",
          tabBarIcon: ({ color, size }) => <FileCheck color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="submissions"
        options={{
          title: "Monitor",
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="roster"
        options={{
          title: "Roster",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size || 18} />,
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          title: "Materials",
          tabBarIcon: ({ color, size }) => <FolderKanban color={color} size={size || 18} />,
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
