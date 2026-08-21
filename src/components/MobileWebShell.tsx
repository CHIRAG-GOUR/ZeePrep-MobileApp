import React from "react";
import { View, Platform } from "react-native";
import { WebDesktopShell } from "./WebDesktopShell";

interface MobileWebShellProps {
  children?: React.ReactNode;
}

export function MobileWebShell({ children }: MobileWebShellProps) {
  if (Platform.OS === "web") {
    return <WebDesktopShell>{children}</WebDesktopShell>;
  }

  // Native iOS / Android: full width pass-through without web shell overhead
  return <View style={{ flex: 1 }}>{children}</View>;
}

