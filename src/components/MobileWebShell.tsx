import React from "react";
import { View, StyleSheet, Platform, useWindowDimensions, Text } from "react-native";
import { ZEEPREP_THEME } from "../constants/theme";

interface MobileWebShellProps {
  children: React.ReactNode;
}

export function MobileWebShell({ children }: MobileWebShellProps) {
  const { width, height } = useWindowDimensions();

  // Only apply phone mockup wrapper on desktop web browser when width > 500px
  if (Platform.OS === "web" && width > 500) {
    return (
      <View style={styles.webContainer}>
        {/* Top Header Bar for Desktop Web Preview */}
        <View style={styles.previewHeader}>
          <View style={styles.brandingGroup}>
            <View style={styles.statusDot} />
            <Text style={styles.headerTitle}>ZeePrep Mobile Preview</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Simulating Mobile Viewport (414px × 896px)
          </Text>
        </View>

        {/* Mobile Phone Mockup Frame */}
        <View style={[styles.phoneFrame, { height: Math.min(height - 80, 896) }]}>
          {/* Virtual Top Notch / Dynamic Island */}
          <View style={styles.notchContainer}>
            <View style={styles.notchCamera} />
            <View style={styles.notchSpeaker} />
          </View>

          {/* Actual Mobile App Render Surface */}
          <View style={styles.appSurface}>
            {children}
          </View>

          {/* Virtual Home Bar Indicator */}
          <View style={styles.homeBarContainer}>
            <View style={styles.homeBar} />
          </View>
        </View>
      </View>
    );
  }

  // Native iOS / Android or Mobile Web view: full width pass-through
  return <View style={{ flex: 1 }}>{children}</View>;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: "#0B0F19",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  previewHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  brandingGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  phoneFrame: {
    width: 414,
    maxWidth: "100%",
    backgroundColor: ZEEPREP_THEME.colors.background,
    borderRadius: 44,
    borderWidth: 10,
    borderColor: "#1E293B",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    position: "relative",
  },
  notchContainer: {
    height: 28,
    backgroundColor: "#0B0F19",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 9999,
  },
  notchCamera: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1E293B",
  },
  notchSpeaker: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1E293B",
  },
  appSurface: {
    flex: 1,
    overflow: "hidden",
  },
  homeBarContainer: {
    height: 20,
    backgroundColor: ZEEPREP_THEME.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  homeBar: {
    width: 134,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
});
