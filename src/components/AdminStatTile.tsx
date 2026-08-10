import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { ZEEPREP_THEME } from "../constants/theme";

interface AdminStatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBgColor?: string;
  cardWidth: number;
  accessibilityLabel?: string;
}

export function AdminStatTile({
  icon,
  value,
  label,
  iconBgColor = "#EEF2FF",
  cardWidth,
  accessibilityLabel,
}: AdminStatTileProps) {
  return (
    <View
      style={[styles.tile, { width: cardWidth }]}
      accessibilityLabel={accessibilityLabel || `${value} ${label}`}
      accessibilityRole="text"
    >
      {/* Top Centered Icon Badge */}
      <View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>

      {/* Large Numerical Value */}
      <Text style={styles.valueText}>{value}</Text>

      {/* Uppercase Clean Label */}
      <Text style={styles.labelText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  valueText: {
    fontSize: 24,
    fontWeight: "900",
    color: ZEEPREP_THEME.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
    textAlign: "center",
  },
  labelText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
