export const ZEEPREP_THEME = {
  colors: {
    primary: "#4F46E5",       // Indigo 600
    primaryHover: "#4338CA",  // Indigo 700
    primaryLight: "#EEF2FF", // Indigo 50
    secondary: "#0F172A",     // Slate 900 / Deep Navy
    background: "#F8FAFC",    // Slate 50
    surface: "#FFFFFF",       // White
    border: "#E2E8F0",       // Slate 200
    borderFocus: "#6366F1",  // Indigo 500
    textPrimary: "#0F172A",  // Slate 900
    textSecondary: "#475569",// Slate 600
    textMuted: "#94A3B8",    // Slate 400
    success: "#10B981",      // Emerald 500
    successLight: "#ECFDF5", // Emerald 50
    warning: "#F59E0B",      // Amber 500
    warningLight: "#FFFBEB", // Amber 50
    error: "#EF4444",        // Red 500
    errorLight: "#FEF2F2",   // Red 50
    cardShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  typography: {
    fontFamily: "System",
  },
};

// Expo Template Theme Compatibility (Light Theme Only)
export const Colors = {
  light: {
    text: "#0F172A",
    textSecondary: "#475569",
    background: "#F8FAFC",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#EEF2FF",
    tint: "#4F46E5",
    icon: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: "#4F46E5",
  },
  dark: {
    text: "#0F172A",
    textSecondary: "#475569",
    background: "#F8FAFC",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#EEF2FF",
    tint: "#4F46E5",
    icon: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: "#4F46E5",
  },
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Fonts = {
  regular: "System",
  bold: "System",
  mono: "System",
};

export type ThemeColor = keyof typeof Colors.light;
export const BottomTabInset = 64;
export const MaxContentWidth = 1200;
