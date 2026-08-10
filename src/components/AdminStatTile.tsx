import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { ZEEPREP_THEME } from "../constants/theme";

interface MetricTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBgColor?: string;
  accessibilityLabel?: string;
  isSmallText?: boolean;
}

export function AdminStatTile({
  icon,
  value,
  label,
  iconBgColor = "#EEF2FF",
  accessibilityLabel,
  isSmallText = false,
}: MetricTileProps) {
  return (
    <View
      style={styles.metricTile}
      accessibilityLabel={accessibilityLabel || `${value} ${label}`}
      accessibilityRole="text"
    >
      {/* Top Centered Icon Badge */}
      <View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>

      {/* Large Prominent Numerical Value */}
      <Text
        style={[styles.valueText, isSmallText && styles.valueTextSmall]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      {/* Uppercase Clean Label */}
      <Text style={styles.labelText} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metricTile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  valueText: {
    fontSize: 18,
    fontWeight: "900",
    color: ZEEPREP_THEME.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 2,
    textAlign: "center",
  },
  valueTextSmall: {
    fontSize: 11,
    fontWeight: "900",
    color: "#059669",
  },
  labelText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
