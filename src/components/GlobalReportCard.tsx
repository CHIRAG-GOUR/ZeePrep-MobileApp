/**
 * ZeePrep — Global Student Report Card
 * Combined cross-subject academic view composed FROM the per-subject forecasts.
 * Shows overall %, likely range, confidence, trend, global level-by-level breakdown,
 * global adaptive readiness gate, exam progression growth, and per-subject matrix.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Layers,
  Compass,
  History,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react-native";
import PreparationTrendChart from "./PreparationTrendChart";
import { ZEEPREP_THEME as T } from "../constants/theme";
import type { GlobalStudentReport } from "../services/global-report-engine";
import type { ForecastTrend, ForecastConfidence } from "../types/forecast";

const INK = "#1E1B4B";
const AMBER = "#FBBF24";

const TREND: Record<ForecastTrend, { glyph: string; color: string }> = {
  strong_growth: { glyph: "↑", color: "#059669" },
  growth: { glyph: "↑", color: "#059669" },
  stable: { glyph: "→", color: "#64748B" },
  declining: { glyph: "↓", color: "#DC2626" },
  strong_decline: { glyph: "↓", color: "#DC2626" },
  inconsistent: { glyph: "↕", color: "#B45309" },
};

const CONF_LABEL: Record<ForecastConfidence, string> = {
  insufficient: "Insufficient",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export interface GlobalReportCardProps {
  report: GlobalStudentReport | null;
  isDesktopWeb: boolean;
  width: number;
}

export default function GlobalReportCard({ report, isDesktopWeb, width }: GlobalReportCardProps) {
  if (!report || !report.hasEnoughData) {
    return (
      <View style={styles.card}>
        <Text style={styles.header}>Global Preparation Report</Text>
        <Text style={styles.empty}>
          Your combined academic report will appear here once you complete assessments across your subjects.
        </Text>
      </View>
    );
  }

  const trend = TREND[report.overallTrend];
  const chartWidth = isDesktopWeb ? Math.min(560, Math.round(width * 0.5)) : Math.max(260, width - 88);
  const series = report.overallTrendSeries.map((p) => ({ date: p.date, value: p.value }));
  const lb = report.levelBreakdown;
  const gate = report.globalReadinessGate;
  const prog = report.globalProgression;

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Global Board Preparation Report</Text>

      <View style={isDesktopWeb ? styles.bodyWeb : undefined}>
        <View style={isDesktopWeb ? styles.colLeft : undefined}>
          {/* Overall hero */}
          <View style={styles.hero}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.heroBadge}>COMBINED PROJECTED BOARD SCORE</Text>
              <View style={styles.estPill}>
                <Sparkles size={11} color={AMBER} />
                <Text style={styles.estPillText}>Multi-Subject Model</Text>
              </View>
            </View>
            <Text style={styles.heroValue}>{report.overallPredicted}%</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>Likely Range</Text>
                <Text style={styles.heroSv}>{report.overallRange.min}% – {report.overallRange.max}%</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>Confidence</Text>
                <Text style={styles.heroSv}>{CONF_LABEL[report.overallConfidence]}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>Trend</Text>
                <Text style={[styles.heroSv, { color: trend.color === "#64748B" ? "#CBD5E1" : trend.color }]}>
                  {trend.glyph} {report.overallTrend.replace("_", " ")}
                </Text>
              </View>
            </View>
          </View>

          {/* Breadth metrics */}
          <View style={styles.breadthRow}>
            <Pill label="Assessed Subjects" value={String(report.distinctSubjects)} />
            <Pill label="Distinct Topics" value={String(report.topicsAssessed)} />
            <Pill label="Total Exams" value={String(report.totalAssessments)} />
          </View>
        </View>

        <View style={isDesktopWeb ? styles.colRight : styles.chartMobile}>
          {series.length >= 2 ? (
            <PreparationTrendChart
              actualSeries={series}
              variant={isDesktopWeb ? "web" : "mobile"}
              width={chartWidth}
            />
          ) : (
            <Text style={styles.miniNote}>Overall trend will build as you complete more assessments.</Text>
          )}
        </View>
      </View>

      {/* ── 1. GLOBAL LEVEL BREAKDOWN & PREDICTIONS ── */}
      {lb && (
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Layers size={16} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Overall Report by Level</Text>
            </View>
            <View style={styles.avgPill}>
              <Text style={styles.avgPillText}>3-Level Avg: {lb.overallCompositeAverage}%</Text>
            </View>
          </View>

          <View style={styles.levelGrid}>
            <View style={[styles.levelBox, { borderColor: "#BFDBFE" }]}>
              <Text style={[styles.levelTag, { color: "#1D4ED8" }]}>LEVEL 1</Text>
              <Text style={styles.levelTitle}>Foundations</Text>
              <Text style={styles.levelScore}>{lb.level1Predicted}%</Text>
              <Text style={styles.levelMeta}>Accuracy: {lb.level1Accuracy}%</Text>
            </View>

            <View style={[styles.levelBox, { borderColor: "#DDD6FE" }]}>
              <Text style={[styles.levelTag, { color: "#6D28D9" }]}>LEVEL 2</Text>
              <Text style={styles.levelTitle}>Applications</Text>
              <Text style={styles.levelScore}>{lb.level2Predicted}%</Text>
              <Text style={styles.levelMeta}>Accuracy: {lb.level2Accuracy}%</Text>
            </View>

            <View style={[styles.levelBox, { borderColor: "#FED7AA" }]}>
              <Text style={[styles.levelTag, { color: "#C2410C" }]}>LEVEL 3</Text>
              <Text style={styles.levelTitle}>Advanced HOTS</Text>
              <Text style={styles.levelScore}>{lb.level3Predicted}%</Text>
              <Text style={styles.levelMeta}>Accuracy: {lb.level3Accuracy}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── 2. GLOBAL READINESS GATE & LEVEL PROGRESSION ── */}
      {gate && (
        <View style={styles.gateCard}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Compass size={17} color={gate.isReadyForNextLevel ? "#059669" : "#D97706"} />
              <View style={{ flex: 1 }}>
                <Text style={styles.gateTitle}>Cross-Subject Level Progression</Text>
                <Text style={styles.gateSub}>{gate.rationale}</Text>
              </View>
            </View>
            <View style={[styles.gatePill, gate.isReadyForNextLevel ? styles.gateReady : styles.gatePending]}>
              <Text style={[styles.gatePillText, gate.isReadyForNextLevel ? styles.gateReadyText : styles.gatePendingText]}>
                {gate.isReadyForNextLevel ? `Ready for Level ${gate.nextRecommendedLevel}` : `Level ${gate.currentLevel} Practice Required`}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── 3. GLOBAL EXAM PROGRESSION STATS ── */}
      {prog && (
        <View style={styles.progCard}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <History size={16} color="#4F46E5" />
              <View style={{ flex: 1 }}>
                <Text style={styles.progTitle}>Exam-to-Exam Growth</Text>
                <Text style={styles.progSub}>{prog.summarySentence}</Text>
              </View>
            </View>
            <View style={styles.consistencyBadge}>
              <Text style={styles.consistencyText}>{prog.consistencyRating} Consistency</Text>
            </View>
          </View>
        </View>
      )}

      {/* Subject breakdown */}
      <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Subject Forecast Breakdown</Text>
      <View style={styles.subjectList}>
        {report.subjects.map((s) => {
          const st = TREND[s.trend];
          return (
            <View key={s.subjectKey} style={styles.subjectRow}>
              <Text style={styles.subjectName} numberOfLines={1}>{s.subjectDisplay}</Text>
              <View style={styles.subjectBarTrack}>
                <View style={[styles.subjectBarFill, { width: `${s.predictedPercentage}%` }]} />
              </View>
              <Text style={styles.subjectPct}>{s.predictedPercentage}%</Text>
              <Text style={[styles.subjectTrend, { color: st.color }]}>{st.glyph}</Text>
            </View>
          );
        })}
      </View>

      {(report.strongestSubject || report.weakestSubject) && (
        <View style={styles.chips}>
          {report.strongestSubject && (
            <Text style={[styles.chip, styles.chipGood]}>Strongest: {report.strongestSubject}</Text>
          )}
          {report.weakestSubject && report.weakestSubject !== report.strongestSubject && (
            <Text style={[styles.chip, styles.chipWarn]}>Needs focus: {report.weakestSubject}</Text>
          )}
        </View>
      )}

      <Text style={styles.footNote}>
        Current preparation forecast is calculated as an evidence-weighted composition of each subject's board prediction. It is an educational estimate, not a guaranteed final examination result.
      </Text>
    </View>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    marginVertical: 10,
    gap: 14,
    ...(({ boxShadow: "0 4px 16px rgba(0,0,0,0.04)" } as any)),
  },
  header: { fontSize: 18, fontWeight: "900", color: T.colors.textPrimary },
  empty: { fontSize: 13, color: T.colors.textSecondary, lineHeight: 19 },
  bodyWeb: { flexDirection: "row", gap: 18, alignItems: "flex-start" },
  colLeft: { flex: 1, minWidth: 250, gap: 12 },
  colRight: { flexShrink: 0 },
  chartMobile: { alignItems: "center" },
  hero: { backgroundColor: INK, borderRadius: 20, padding: 18, gap: 6 },
  heroBadge: { color: AMBER, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  estPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  estPillText: { color: AMBER, fontSize: 10, fontWeight: "800" },
  heroValue: { color: AMBER, fontSize: 46, fontWeight: "900", lineHeight: 50 },
  heroStatsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  heroDivider: { width: 1, alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.12)" },
  heroStat: { flex: 1, gap: 3 },
  heroLabel: { color: "#A5B4FC", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  heroSv: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  breadthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  pillLabel: { fontSize: 11, color: T.colors.textSecondary, fontWeight: "600" },
  pillValue: { fontSize: 13, color: T.colors.textPrimary, fontWeight: "800" },
  miniNote: { fontSize: 12, color: T.colors.textMuted, textAlign: "center", padding: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: T.colors.textPrimary, textTransform: "uppercase", letterSpacing: 0.4 },

  levelCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
  },
  levelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avgPill: { backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#A7F3D0" },
  avgPillText: { fontSize: 11, fontWeight: "800", color: "#065F46" },
  levelGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  levelBox: { flex: 1, minWidth: 95, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, padding: 10, gap: 2 },
  levelTag: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },
  levelTitle: { fontSize: 11, fontWeight: "800", color: "#1E293B" },
  levelScore: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginVertical: 2 },
  levelMeta: { fontSize: 10, color: "#64748B" },

  gateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  gateTitle: { fontSize: 12.5, fontWeight: "800", color: "#1E293B" },
  gateSub: { fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 15 },
  gatePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  gateReady: { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0" },
  gatePending: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A" },
  gatePillText: { fontSize: 10.5, fontWeight: "800" },
  gateReadyText: { color: "#047857" },
  gatePendingText: { color: "#B45309" },

  progCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  progTitle: { fontSize: 12.5, fontWeight: "800", color: "#1E293B" },
  progSub: { fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 15 },
  consistencyBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#C7D2FE" },
  consistencyText: { fontSize: 10.5, fontWeight: "800", color: "#4338CA" },

  subjectList: { gap: 8 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  subjectName: { width: 108, fontSize: 13, fontWeight: "700", color: T.colors.textPrimary },
  subjectBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#EEF2FF", overflow: "hidden" },
  subjectBarFill: { height: 8, borderRadius: 4, backgroundColor: T.colors.primary },
  subjectPct: { width: 42, textAlign: "right", fontSize: 13, fontWeight: "800", color: T.colors.textPrimary },
  subjectTrend: { width: 16, textAlign: "center", fontSize: 16, fontWeight: "900" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { fontSize: 12, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, overflow: "hidden" },
  chipGood: { backgroundColor: "#ECFDF5", color: "#059669" },
  chipWarn: { backgroundColor: "#FFFBEB", color: "#B45309" },
  footNote: { fontSize: 11, color: T.colors.textMuted, marginTop: 4, lineHeight: 16 },
});
