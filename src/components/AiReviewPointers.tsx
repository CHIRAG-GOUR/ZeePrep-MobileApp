/**
 * ZeePrep — AI Review Pointers (evidence-based, one-line).
 * Renders the four-category report review as visually distinct rows with Lucide
 * icons (never paragraph cards): Doing Well · Focus More · Watch Out · Next Step.
 * Localized loading + AI-failure states keep the rest of the report usable.
 */
import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { CheckCircle2, AlertTriangle, Eye, ArrowRight } from "lucide-react-native";
import { ZEEPREP_THEME as T } from "../constants/theme";
import type { ReportPointers } from "../services/report-pointers-engine";

const CARD_RADIUS = 24;

type Group = {
  key: keyof Omit<ReportPointers, "source">;
  label: string;
  color: string;
  tint: string;
  Icon: any;
};

const GROUPS: Group[] = [
  { key: "doingWell", label: "Doing Well", color: "#059669", tint: "#ECFDF5", Icon: CheckCircle2 },
  { key: "focusMore", label: "Focus More", color: "#B45309", tint: "#FFFBEB", Icon: AlertTriangle },
  { key: "watchOut", label: "Watch Out", color: "#BE123C", tint: "#FFF1F2", Icon: Eye },
  { key: "nextSteps", label: "Next Step", color: "#4338CA", tint: "#EEF2FF", Icon: ArrowRight },
];

export interface AiReviewPointersProps {
  pointers: ReportPointers | null;
  loading: boolean;
  isDesktopWeb: boolean;
}

export default function AiReviewPointers({ pointers, loading, isDesktopWeb }: AiReviewPointersProps) {
  const hasAny =
    pointers &&
    (pointers.doingWell.length || pointers.focusMore.length || pointers.watchOut.length || pointers.nextSteps.length);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>AI Review</Text>
        {pointers?.source === "deterministic" && !loading && (
          <Text style={styles.tag}>Evidence summary</Text>
        )}
      </View>

      {loading && !hasAny ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={T.colors.primary} />
          <Text style={styles.loadingText}>Analyzing your recent performance…</Text>
        </View>
      ) : !hasAny ? (
        <Text style={styles.unavailable}>
          AI review is temporarily unavailable. Your performance report is still available.
        </Text>
      ) : (
        <View style={isDesktopWeb ? styles.groupsWeb : undefined}>
          {GROUPS.map((g) => {
            const items = (pointers as ReportPointers)[g.key];
            if (!items || items.length === 0) return null;
            const Icon = g.Icon;
            return (
              <View key={g.key} style={[styles.group, isDesktopWeb && styles.groupWeb]}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: g.tint }]}>
                    <Icon size={14} color={g.color} />
                  </View>
                  <Text style={[styles.groupLabel, { color: g.color }]}>{g.label}</Text>
                </View>
                {items.map((p, i) => (
                  <View key={i} style={styles.row}>
                    <View style={[styles.bullet, { backgroundColor: g.color }]} />
                    <Text style={styles.rowText}>{p}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    marginVertical: 10,
    gap: 12,
    ...(({ boxShadow: "0 4px 16px rgba(0,0,0,0.04)" } as any)),
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  header: { fontSize: 17, fontWeight: "900", color: T.colors.textPrimary, letterSpacing: 0.2 },
  tag: { fontSize: 10, fontWeight: "700", color: T.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  loadingBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  loadingText: { color: T.colors.textSecondary, fontSize: 13 },
  unavailable: { color: T.colors.textSecondary, fontSize: 13, lineHeight: 19, paddingVertical: 6 },
  groupsWeb: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  group: { gap: 6, marginTop: 4 },
  groupWeb: { flex: 1, minWidth: 260 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  groupIcon: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  groupLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  row: { flexDirection: "row", gap: 9, alignItems: "flex-start", paddingLeft: 2 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  rowText: { flex: 1, fontSize: 13.5, color: T.colors.textPrimary, lineHeight: 20 },
});
