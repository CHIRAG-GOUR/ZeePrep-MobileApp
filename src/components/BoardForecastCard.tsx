/**
 * ZeePrep — Board Preparation Forecast Card
 * Renders the subject-specific board/final examination readiness forecast:
 * predicted %, likely range, explainable confidence, deterministic trend,
 * animated preparation graph, and structured (non-paragraph) AI pointers.
 *
 * variant "student"  → student-facing forecast.
 * variant "teacher"  → adds diagnostics (coverage, volatility, level progression,
 *                       confidence reasons) for authorized faculty.
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import PreparationTrendChart from "./PreparationTrendChart";
import { ZEEPREP_THEME as T } from "../constants/theme";
import type { BoardForecastSnapshot, SubjectAssessmentProfile, SubjectForecastRecord, ForecastConfidence, ForecastTrend } from "../types/forecast";

export interface BoardForecastCardProps {
  snapshot: BoardForecastSnapshot | null;
  profile: SubjectAssessmentProfile | null;
  record: SubjectForecastRecord | null;
  loading: boolean;
  variant: "student" | "teacher";
  isDesktopWeb: boolean;
  width: number;
  onRetry?: () => void;
}

const CONF_META: Record<ForecastConfidence, { label: string; color: string; fill: number }> = {
  insufficient: { label: "Insufficient data", color: T.colors.textMuted, fill: 1 },
  low: { label: "Low", color: T.colors.warning, fill: 3 },
  medium: { label: "Medium", color: T.colors.primary, fill: 6 },
  high: { label: "High", color: T.colors.success, fill: 9 },
};

const TREND_META: Record<ForecastTrend, { glyph: string; label: string; color: string }> = {
  strong_growth: { glyph: "↑", label: "Improving strongly", color: T.colors.success },
  growth: { glyph: "↑", label: "Improving", color: T.colors.success },
  stable: { glyph: "→", label: "Steady", color: T.colors.textSecondary },
  declining: { glyph: "↓", label: "Declining", color: T.colors.error },
  strong_decline: { glyph: "↓", label: "Declining sharply", color: T.colors.error },
  inconsistent: { glyph: "↕", label: "Inconsistent", color: T.colors.warning },
};

function Pointer({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.pointerRow}>
      <View style={[styles.pointerDot, { backgroundColor: color }]} />
      <Text style={styles.pointerText}>{text}</Text>
    </View>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {items.map((it, i) => (
        <Pointer key={i} text={it} color={color} />
      ))}
    </View>
  );
}

export default function BoardForecastCard(props: BoardForecastCardProps) {
  const { snapshot, profile, record, loading, variant, isDesktopWeb, width } = props;
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showWhy, setShowWhy] = useState(variant === "teacher");

  const subject = snapshot?.subjectDisplay || profile?.subjectDisplay || "Subject";

  // ── Loading (localized to the forecast section) ──
  if (loading && !snapshot) {
    return (
      <View style={styles.card}>
        <Text style={styles.header}>{subject} — Board Preparation Forecast</Text>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={T.colors.primary} />
          <Text style={styles.loadingText}>Building your board preparation forecast…</Text>
        </View>
      </View>
    );
  }

  // ── Empty / insufficient ──
  const insufficient = !snapshot || snapshot.confidence === "insufficient" || (profile?.assessmentCount ?? 0) === 0;
  if (insufficient) {
    return (
      <View style={styles.card}>
        <Text style={styles.header}>{subject} — Board Preparation Forecast</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Not enough data yet</Text>
          <Text style={styles.emptyText}>
            Complete assessments to start building your board preparation forecast. Each new test across topics and difficulty levels sharpens the estimate.
          </Text>
        </View>
      </View>
    );
  }

  const conf = CONF_META[snapshot.confidence];
  const trend = TREND_META[snapshot.trend];
  const singleAssessment = (profile?.assessmentCount ?? 0) < 2;

  const actualSeries = (profile?.dataPoints || []).map((d) => ({ date: d.date, value: d.percentage }));
  const predictedSeries = (record?.history || []).map((h) => ({ date: h.date, value: h.predictedPercentage }));

  const chartWidth = isDesktopWeb ? Math.min(640, width) : width;

  const Hero = (
    <View style={[styles.heroWrap, isDesktopWeb && styles.heroWrapWeb]}>
      <View style={styles.heroPrimary}>
        <Text style={styles.heroLabel}>Predicted Board Score</Text>
        <Text style={styles.heroValue}>{snapshot.predictedPercentage}%</Text>
        {singleAssessment && <Text style={styles.earlyTag}>Early estimate</Text>}
      </View>
      <View style={styles.heroStatsRow}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Likely Range</Text>
          <Text style={styles.heroStatValue}>
            {snapshot.minPrediction}% – {snapshot.maxPrediction}%
          </Text>
        </View>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Confidence</Text>
          <View style={styles.confRow}>
            <Text style={[styles.heroStatValue, { color: conf.color }]}>{conf.label}</Text>
          </View>
          <View style={styles.meter}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={[styles.meterSeg, { backgroundColor: i < conf.fill ? conf.color : T.colors.border }]} />
            ))}
          </View>
        </View>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Preparation Trend</Text>
          <View style={styles.trendChip}>
            <Text style={[styles.trendGlyph, { color: trend.color }]}>{trend.glyph}</Text>
            <Text style={[styles.trendLabel, { color: trend.color }]}>{trend.label}</Text>
          </View>
          {typeof profile?.improvementRate === "number" && profile.assessmentCount >= 2 && (
            <Text style={styles.trendSub}>
              {profile.improvementRate > 0 ? "+" : ""}
              {profile.improvementRate} pts / assessment
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{subject} — Board Preparation Forecast</Text>
        <Pressable onPress={() => setShowDisclaimer((s) => !s)} hitSlop={8} style={styles.infoBtn}>
          <Text style={styles.infoGlyph}>{"ⓘ"}</Text>
        </Pressable>
      </View>
      {snapshot.source === "deterministic" && (
        <Text style={styles.offlineTag}>Offline estimate — AI interpretation will refresh when available.</Text>
      )}
      {showDisclaimer && (
        <Text style={styles.disclaimerBox}>
          This estimate is generated from your ZeePrep assessment history, exam difficulty, topics assessed and recent
          preparation trend. It is not a guaranteed board result.
        </Text>
      )}

      {/* Hero + Chart: side-by-side on desktop web, stacked on mobile */}
      <View style={[isDesktopWeb ? styles.bodyWeb : styles.bodyMobile]}>
        <View style={isDesktopWeb ? styles.colLeftWeb : undefined}>{Hero}</View>
        <View style={isDesktopWeb ? styles.colRightWeb : styles.chartMobile}>
          <PreparationTrendChart
            actualSeries={actualSeries}
            predictedSeries={predictedSeries}
            predictedPercentage={snapshot.predictedPercentage}
            range={{ min: snapshot.minPrediction, max: snapshot.maxPrediction }}
            variant={isDesktopWeb ? "web" : "mobile"}
            width={chartWidth}
          />
        </View>
      </View>

      {/* Summary pointers */}
      {snapshot.summaryPointers?.length > 0 && (
        <View style={styles.summaryBox}>
          {snapshot.summaryPointers.map((p, i) => (
            <Pointer key={i} text={p} color={T.colors.primary} />
          ))}
        </View>
      )}

      {/* Structured sections */}
      <View style={isDesktopWeb ? styles.sectionsWeb : undefined}>
        <Section title="Strong Areas" items={snapshot.strengths} color={T.colors.success} />
        <Section title="Needs Attention" items={snapshot.improvementAreas} color={T.colors.warning} />
        <Section title="Next Steps" items={snapshot.nextActions} color={T.colors.primary} />
      </View>

      {/* Why this confidence */}
      {snapshot.confidenceReasons?.length > 0 && (
        <View style={styles.whyBox}>
          <Pressable onPress={() => setShowWhy((s) => !s)} style={styles.whyHeader}>
            <Text style={styles.whyTitle}>Why confidence is {conf.label}?</Text>
            <Text style={styles.whyToggle}>{showWhy ? "−" : "+"}</Text>
          </Pressable>
          {showWhy &&
            snapshot.confidenceReasons.map((r, i) => (
              <Pointer key={i} text={r} color={T.colors.textSecondary} />
            ))}
        </View>
      )}

      {/* Teacher-only diagnostics */}
      {variant === "teacher" && profile && (
        <View style={styles.diagBox}>
          <Text style={styles.diagTitle}>Faculty Diagnostics</Text>
          <View style={styles.diagGrid}>
            <Diag label="Valid assessments" value={String(profile.assessmentCount)} />
            <Diag label="Topics assessed" value={String(profile.distinctTopics.length)} />
            <Diag label="Breadth signal" value={`${profile.coverageSignal}/100`} />
            <Diag label="Volatility" value={`${profile.volatility} pts`} />
            <Diag label="Improvement rate" value={`${profile.improvementRate > 0 ? "+" : ""}${profile.improvementRate}/test`} />
            <Diag
              label="Level progression"
              value={`L1 ${profile.levelCoverage.level1} · L2 ${profile.levelCoverage.level2} · L3 ${profile.levelCoverage.level3}`}
            />
          </View>
          {snapshot.warningFlags && snapshot.warningFlags.length > 0 && (
            <View style={styles.warnBox}>
              {snapshot.warningFlags.map((w, i) => (
                <Pointer key={i} text={w} color={T.colors.error} />
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={styles.footNote}>
        {"ⓘ"} This is an estimate based on your ZeePrep assessments. It is not a guaranteed board result.
      </Text>
    </View>
  );
}

function Diag({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.diagItem}>
      <Text style={styles.diagValue}>{value}</Text>
      <Text style={styles.diagLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: T.borderRadius.lg,
    borderWidth: 1,
    borderColor: T.colors.border,
    padding: 16,
    marginVertical: 10,
    gap: 10,
    ...(({ boxShadow: "0 4px 16px rgba(0,0,0,0.04)" } as any)),
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  header: { fontSize: 16, fontWeight: "800", color: T.colors.textPrimary, flexShrink: 1 },
  infoBtn: { paddingHorizontal: 4 },
  infoGlyph: { fontSize: 18, color: T.colors.textMuted },
  offlineTag: { fontSize: 11, color: T.colors.warning, fontWeight: "600" },
  disclaimerBox: {
    fontSize: 12,
    color: T.colors.textSecondary,
    backgroundColor: T.colors.primaryLight,
    padding: 10,
    borderRadius: T.borderRadius.sm,
    lineHeight: 17,
  },
  loadingBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 18 },
  loadingText: { color: T.colors.textSecondary, fontSize: 13 },
  emptyBox: { paddingVertical: 16, gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: T.colors.textPrimary },
  emptyText: { fontSize: 13, color: T.colors.textSecondary, lineHeight: 19 },

  bodyMobile: { gap: 12 },
  bodyWeb: { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  colLeftWeb: { flex: 1, minWidth: 240 },
  colRightWeb: { flexShrink: 0 },
  chartMobile: { alignItems: "center" },

  heroWrap: { gap: 14 },
  heroWrapWeb: { gap: 16 },
  heroPrimary: { alignItems: "flex-start" },
  heroLabel: { fontSize: 12, fontWeight: "700", color: T.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  heroValue: { fontSize: 46, fontWeight: "900", color: T.colors.primary, lineHeight: 50 },
  earlyTag: { fontSize: 11, fontWeight: "700", color: T.colors.warning, marginTop: 2 },
  heroStatsRow: { gap: 12 },
  heroStat: { gap: 3 },
  heroStatLabel: { fontSize: 11, fontWeight: "700", color: T.colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  heroStatValue: { fontSize: 16, fontWeight: "800", color: T.colors.textPrimary },
  confRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meter: { flexDirection: "row", gap: 2, marginTop: 2 },
  meterSeg: { width: 14, height: 7, borderRadius: 2 },
  trendChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  trendGlyph: { fontSize: 18, fontWeight: "900" },
  trendLabel: { fontSize: 15, fontWeight: "800" },
  trendSub: { fontSize: 11, color: T.colors.textMuted, fontWeight: "600" },

  summaryBox: {
    gap: 6,
    backgroundColor: T.colors.background,
    borderRadius: T.borderRadius.md,
    padding: 12,
  },
  sectionsWeb: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  section: { gap: 5, marginTop: 8, flex: 1, minWidth: 220 },
  sectionTitle: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  pointerRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  pointerDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  pointerText: { flex: 1, fontSize: 13, color: T.colors.textPrimary, lineHeight: 19 },

  whyBox: { marginTop: 6, borderTopWidth: 1, borderTopColor: T.colors.border, paddingTop: 8, gap: 5 },
  whyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  whyTitle: { fontSize: 13, fontWeight: "700", color: T.colors.textSecondary },
  whyToggle: { fontSize: 18, fontWeight: "800", color: T.colors.textMuted },

  diagBox: { marginTop: 8, backgroundColor: T.colors.secondary, borderRadius: T.borderRadius.md, padding: 12, gap: 8 },
  diagTitle: { fontSize: 12, fontWeight: "800", color: "#E2E8F0", textTransform: "uppercase", letterSpacing: 0.5 },
  diagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  diagItem: { minWidth: 92 },
  diagValue: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  diagLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "600", marginTop: 1 },
  warnBox: { gap: 4, marginTop: 4 },

  footNote: { fontSize: 11, color: T.colors.textMuted, marginTop: 6, lineHeight: 16 },
});
