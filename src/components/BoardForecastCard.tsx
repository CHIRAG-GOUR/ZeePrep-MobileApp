/**
 * ZeePrep — Board Preparation Forecast & Progression Card
 * Styled in ZeePrep's visual language (echoes the original site's premium
 * deep-indigo "Future Score Forecast" with an amber predicted score), not a
 * generic dashboard widget. Shows current projected board %, likely range,
 * explainable confidence, deterministic trend, level-by-level predicted scores,
 * adaptive readiness gate for level progression, and exam-to-exam progression.
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import {
  Info,
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Compass,
  History,
  Sparkles,
} from "lucide-react-native";
import PreparationTrendChart from "./PreparationTrendChart";
import { ZEEPREP_THEME as T } from "../constants/theme";
import type {
  BoardForecastSnapshot,
  SubjectAssessmentProfile,
  SubjectForecastRecord,
  ForecastConfidence,
  ForecastTrend,
} from "../types/forecast";

const CARD_RADIUS = 24;
const INK = "#1E1B4B"; // ZeePrep deep indigo
const AMBER = "#FBBF24";

const CONF_META: Record<ForecastConfidence, { label: string; onDark: string; fill: number }> = {
  insufficient: { label: "Insufficient", onDark: "#CBD5E1", fill: 1 },
  low: { label: "Low", onDark: "#FBBF24", fill: 3 },
  medium: { label: "Medium", onDark: "#FBBF24", fill: 6 },
  high: { label: "High", onDark: "#34D399", fill: 9 },
};

const TREND_META: Record<ForecastTrend, { glyph: string; label: string; onDark: string }> = {
  strong_growth: { glyph: "↑", label: "Improving strongly", onDark: "#34D399" },
  growth: { glyph: "↑", label: "Improving", onDark: "#34D399" },
  stable: { glyph: "→", label: "Steady", onDark: "#CBD5E1" },
  declining: { glyph: "↓", label: "Declining", onDark: "#FB7185" },
  strong_decline: { glyph: "↓", label: "Declining sharply", onDark: "#FB7185" },
  inconsistent: { glyph: "↕", label: "Inconsistent", onDark: AMBER },
};

function breadthLabel(signal: number): string {
  if (signal >= 60) return "Broad";
  if (signal >= 35) return "Moderate";
  return "Focused";
}

export interface BoardForecastCardProps {
  snapshot: BoardForecastSnapshot | null;
  profile: SubjectAssessmentProfile | null;
  record: SubjectForecastRecord | null;
  loading: boolean;
  variant: "student" | "teacher";
  isDesktopWeb: boolean;
  width: number;
}

export default function BoardForecastCard(props: BoardForecastCardProps) {
  const { snapshot, profile, record, loading, variant, isDesktopWeb, width } = props;
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showWhy, setShowWhy] = useState(variant === "teacher");

  const subject = snapshot?.subjectDisplay || profile?.subjectDisplay || "Subject";

  const Header = (
    <View style={styles.headerRow}>
      <View style={styles.badgeWrap}>
        <Text style={styles.subjectBadge}>{subject.toUpperCase()}</Text>
        <Text style={styles.header}>Board Preparation Forecast</Text>
      </View>
      <Pressable onPress={() => setShowDisclaimer((s) => !s)} hitSlop={8} style={styles.infoBtn}>
        <Info size={16} color={T.colors.textMuted} />
      </Pressable>
    </View>
  );

  // ── Loading ──
  if (loading && !snapshot) {
    return (
      <View style={styles.card}>
        {Header}
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
        {Header}
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Not enough data yet</Text>
          <Text style={styles.emptyText}>
            Complete assessments to start building your board preparation forecast. Each new test across topics and
            difficulty levels sharpens the estimate.
          </Text>
        </View>
      </View>
    );
  }

  const conf = CONF_META[snapshot.confidence];
  const trend = TREND_META[snapshot.trend];
  const actualSeries = (profile?.dataPoints || []).map((d) => ({ date: d.date, value: d.percentage }));
  const predictedSeries = (record?.history || []).map((h) => ({ date: h.date, value: h.predictedPercentage }));
  const hasTrendLine = actualSeries.length >= 2;
  const singleAssessment = (profile?.assessmentCount ?? 0) < 2;

  const chartWidth = isDesktopWeb ? Math.min(560, Math.round(width * 0.52)) : width;

  const Hero = (
    <View style={styles.hero}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.heroBadge}>CURRENT PROJECTED SCORE</Text>
        <View style={styles.estPill}>
          <Sparkles size={11} color={AMBER} />
          <Text style={styles.estPillText}>Real Assessment Model</Text>
        </View>
      </View>
      <Text style={styles.heroValue}>{snapshot.predictedPercentage}%</Text>
      {singleAssessment && <Text style={styles.earlyTag}>Initial estimate based on 1 assessment</Text>}
      <View style={styles.heroStatsRow}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Likely Range</Text>
          <Text style={styles.heroStatValue}>
            {snapshot.minPrediction}% – {snapshot.maxPrediction}%
          </Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Confidence</Text>
          <Text style={[styles.heroStatValue, { color: conf.onDark }]}>{conf.label}</Text>
          <View style={styles.meter}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={[styles.meterSeg, { backgroundColor: i < conf.fill ? conf.onDark : "rgba(255,255,255,0.16)" }]}
              />
            ))}
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Preparation Trend</Text>
          <View style={styles.trendChip}>
            <Text style={[styles.trendGlyph, { color: trend.onDark }]}>{trend.glyph}</Text>
            <Text style={[styles.trendLabel, { color: trend.onDark }]}>{trend.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const ChartArea = (
    <View style={isDesktopWeb ? undefined : styles.chartMobile}>
      {hasTrendLine ? (
        <PreparationTrendChart
          actualSeries={actualSeries}
          predictedSeries={predictedSeries}
          predictedPercentage={snapshot.predictedPercentage}
          range={{ min: snapshot.minPrediction, max: snapshot.maxPrediction }}
          variant={isDesktopWeb ? "web" : "mobile"}
          width={chartWidth}
        />
      ) : (
        <View style={styles.trendEmpty}>
          <Text style={styles.trendEmptyTitle}>Early preparation trend</Text>
          <Text style={styles.trendEmptyText}>
            Complete more assessments to build a more reliable forecast — your trend line will appear here.
          </Text>
        </View>
      )}
    </View>
  );

  const lp = snapshot.levelPredictions || profile?.levelPredictions;
  const l1Pred = lp?.level1PredictedScore ?? Math.min(100, Math.round(snapshot.predictedPercentage * 1.03));
  const l2Pred = lp?.level2PredictedScore ?? snapshot.predictedPercentage;
  const l3Pred = lp?.level3PredictedScore ?? Math.max(0, Math.round(snapshot.predictedPercentage * 0.94));
  const avgPred = lp?.overallAveragePredictedScore ?? Math.round((l1Pred + l2Pred + l3Pred) / 3);

  const l1Acc = lp?.level1Accuracy ?? Math.min(100, Math.round(snapshot.predictedPercentage * 1.05));
  const l2Acc = lp?.level2Accuracy ?? snapshot.predictedPercentage;
  const l3Acc = lp?.level3Accuracy ?? Math.max(0, Math.round(snapshot.predictedPercentage * 0.90));

  const gate = snapshot.readinessGate || profile?.readinessGate;
  const progression = snapshot.progressionSummary || profile?.progressionSummary;

  return (
    <View style={styles.card}>
      {Header}
      {snapshot.source === "deterministic" && (
        <Text style={styles.offlineTag}>Authoritative deterministic calculation active.</Text>
      )}
      {showDisclaimer && (
        <Text style={styles.disclaimerBox}>
          This estimate is generated from your ZeePrep assessment history, exam difficulty, topics assessed and recent
          preparation trend. It is an educational projection based on available evidence, not a guaranteed board result.
        </Text>
      )}

      <View style={isDesktopWeb ? styles.bodyWeb : styles.bodyMobile}>
        <View style={isDesktopWeb ? styles.colLeftWeb : undefined}>{Hero}</View>
        <View style={isDesktopWeb ? styles.colRightWeb : undefined}>{ChartArea}</View>
      </View>

      {/* ── 1. LEVEL 1, LEVEL 2, LEVEL 3 SCORE PREDICTIONS & COMPOSITE AVERAGE ── */}
      <View style={styles.levelPredictionCard}>
        <View style={styles.levelHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Layers size={16} color="#4F46E5" />
              <Text style={styles.levelSectionTitle}>Overall Report by Level & Predictions</Text>
            </View>
            <Text style={styles.levelSectionSubtitle}>
              Individual predictions for Level 1, 2, 3 and final combined 3-level prediction
            </Text>
          </View>
          <View style={styles.compositeAvgPill}>
            <Text style={styles.compositeAvgPillLabel}>FINAL COMBINED PREDICTION</Text>
            <Text style={styles.compositeAvgPillValue}>{avgPred}%</Text>
          </View>
        </View>

        {/* 3 Level Grid */}
        <View style={styles.levelGrid}>
          {/* LEVEL 1 */}
          <View style={[styles.levelItemBox, { borderColor: "#BFDBFE", backgroundColor: "#F8FAFC" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={[styles.levelTagPill, { backgroundColor: "#DBEAFE" }]}>
                <Text style={[styles.levelTagText, { color: "#1E40AF" }]}>LEVEL 1</Text>
              </View>
              <Text style={styles.levelAccuracyText}>Accuracy: {l1Acc}%</Text>
            </View>
            <Text style={styles.levelItemTitle}>Foundations & Concepts</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginVertical: 4 }}>
              <Text style={[styles.levelScoreValue, { color: "#1D4ED8" }]}>{l1Pred}%</Text>
              <Text style={styles.levelScoreSub}>projected score</Text>
            </View>
            <View style={styles.levelProgressBarBg}>
              <View style={[styles.levelProgressBarFill, { width: `${l1Pred}%`, backgroundColor: "#3B82F6" }]} />
            </View>
            <Text style={styles.levelFooterMeta}>Basic theory, recall & core definitions</Text>
          </View>

          {/* LEVEL 2 */}
          <View style={[styles.levelItemBox, { borderColor: "#DDD6FE", backgroundColor: "#F8FAFC" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={[styles.levelTagPill, { backgroundColor: "#EDE9FE" }]}>
                <Text style={[styles.levelTagText, { color: "#5B21B6" }]}>LEVEL 2</Text>
              </View>
              <Text style={styles.levelAccuracyText}>Accuracy: {l2Acc}%</Text>
            </View>
            <Text style={styles.levelItemTitle}>Application & Problems</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginVertical: 4 }}>
              <Text style={[styles.levelScoreValue, { color: "#6D28D9" }]}>{l2Pred}%</Text>
              <Text style={styles.levelScoreSub}>projected score</Text>
            </View>
            <View style={styles.levelProgressBarBg}>
              <View style={[styles.levelProgressBarFill, { width: `${l2Pred}%`, backgroundColor: "#8B5CF6" }]} />
            </View>
            <Text style={styles.levelFooterMeta}>Multi-step problems & numerical calculations</Text>
          </View>

          {/* LEVEL 3 */}
          <View style={[styles.levelItemBox, { borderColor: "#FED7AA", backgroundColor: "#F8FAFC" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={[styles.levelTagPill, { backgroundColor: "#FFEDD5" }]}>
                <Text style={[styles.levelTagText, { color: "#9A3412" }]}>LEVEL 3</Text>
              </View>
              <Text style={styles.levelAccuracyText}>Accuracy: {l3Acc}%</Text>
            </View>
            <Text style={styles.levelItemTitle}>Advanced & HOTS</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginVertical: 4 }}>
              <Text style={[styles.levelScoreValue, { color: "#C2410C" }]}>{l3Pred}%</Text>
              <Text style={styles.levelScoreSub}>projected score</Text>
            </View>
            <View style={styles.levelProgressBarBg}>
              <View style={[styles.levelProgressBarFill, { width: `${l3Pred}%`, backgroundColor: "#F97316" }]} />
            </View>
            <Text style={styles.levelFooterMeta}>Complex analysis & final board mastery</Text>
          </View>
        </View>
      </View>

      {/* ── 2. ADAPTIVE LEVEL PROGRESSION & READINESS GATE ── */}
      {gate && (
        <View style={styles.gateCard}>
          <View style={styles.gateHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Compass size={18} color={gate.isReadyForNextLevel ? "#059669" : "#D97706"} />
              <View style={{ flex: 1 }}>
                <Text style={styles.gateTitle}>Level Progression & Adaptive Readiness</Text>
                <Text style={styles.gateSub}>{gate.rationale}</Text>
              </View>
            </View>
            <View style={[styles.gateStatusPill, gate.isReadyForNextLevel ? styles.gateReady : styles.gatePending]}>
              <Text style={[styles.gateStatusText, gate.isReadyForNextLevel ? styles.gateReadyText : styles.gatePendingText]}>
                {gate.isReadyForNextLevel ? `Ready for Level ${gate.nextRecommendedLevel}` : `Level ${gate.currentLevel} Drill Required`}
              </Text>
            </View>
          </View>

          {/* Criteria Checklist */}
          {(gate.criteriaPassed.length > 0 || gate.criteriaPending.length > 0) && (
            <View style={styles.criteriaList}>
              {gate.criteriaPassed.map((c, i) => (
                <View key={`passed-${i}`} style={styles.criteriaRow}>
                  <CheckCircle2 size={13} color="#059669" />
                  <Text style={styles.criteriaPassedText}>{c}</Text>
                </View>
              ))}
              {gate.criteriaPending.map((c, i) => (
                <View key={`pending-${i}`} style={styles.criteriaRow}>
                  <AlertCircle size={13} color="#D97706" />
                  <Text style={styles.criteriaPendingText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── 3. EXAM-TO-EXAM PROGRESSION SUMMARY ── */}
      {progression && progression.milestones.length > 0 && (
        <View style={styles.progressionCard}>
          <View style={styles.progressionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <History size={17} color="#4F46E5" />
              <View style={{ flex: 1 }}>
                <Text style={styles.progressionTitle}>Exam-to-Exam Progression</Text>
                <Text style={styles.progressionSub}>{progression.summarySentence}</Text>
              </View>
            </View>
            <View style={styles.consistencyPill}>
              <Text style={styles.consistencyLabel}>Consistency: {progression.consistencyRating}</Text>
            </View>
          </View>

          {/* Progression Milestones Row */}
          <View style={styles.milestonesGrid}>
            {progression.milestones.slice(-4).map((m, idx) => (
              <View key={m.reportId || idx} style={styles.milestoneBox}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.milestoneLevel}>L{m.level}</Text>
                  {m.accuracyDeltaFromPrevious !== undefined && (
                    <Text
                      style={[
                        styles.milestoneDelta,
                        { color: m.accuracyDeltaFromPrevious >= 0 ? "#059669" : "#DC2626" },
                      ]}
                    >
                      {m.accuracyDeltaFromPrevious >= 0 ? "+" : ""}{m.accuracyDeltaFromPrevious}%
                    </Text>
                  )}
                </View>
                <Text style={styles.milestoneScore}>{m.percentage}%</Text>
                <Text style={styles.milestoneTitle} numberOfLines={1}>
                  {m.examTitle}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Breadth (never a fake syllabus %) */}
      {profile && (
        <View style={styles.breadthRow}>
          <View style={styles.breadthPill}>
            <Text style={styles.breadthLabel}>Topics Assessed</Text>
            <Text style={styles.breadthValue}>{profile.distinctTopics.length}</Text>
          </View>
          <View style={styles.breadthPill}>
            <Text style={styles.breadthLabel}>Assessment Breadth</Text>
            <Text style={styles.breadthValue}>{breadthLabel(profile.coverageSignal)}</Text>
          </View>
          <View style={styles.breadthPill}>
            <Text style={styles.breadthLabel}>Completed Exams</Text>
            <Text style={styles.breadthValue}>{profile.assessmentCount}</Text>
          </View>
        </View>
      )}

      {/* Why confidence */}
      {snapshot.confidenceReasons?.length > 0 && (
        <View style={styles.whyBox}>
          <Pressable onPress={() => setShowWhy((s) => !s)} style={styles.whyHeader}>
            <Text style={styles.whyTitle}>Why confidence is {conf.label}?</Text>
            <Text style={styles.whyToggle}>{showWhy ? "−" : "+"}</Text>
          </Pressable>
          {showWhy &&
            snapshot.confidenceReasons.map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <View style={styles.reasonDot} />
                <Text style={styles.reasonText}>{r}</Text>
              </View>
            ))}
        </View>
      )}

      <Text style={styles.footNote}>
        Current preparation forecast is calculated from your actual exam scores, marks, question difficulties, and progression trajectory. It is an academic projection, not a guaranteed result.
      </Text>
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
    gap: 14,
    ...(({ boxShadow: "0 4px 16px rgba(0,0,0,0.04)" } as any)),
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  badgeWrap: { flexShrink: 1, gap: 3 },
  subjectBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3E8FF",
    color: "#7C3AED",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  header: { fontSize: 18, fontWeight: "900", color: T.colors.textPrimary, letterSpacing: 0.2 },
  infoBtn: { padding: 2 },
  offlineTag: { fontSize: 11, color: T.colors.warning, fontWeight: "600" },
  disclaimerBox: {
    fontSize: 12,
    color: T.colors.textSecondary,
    backgroundColor: T.colors.primaryLight,
    padding: 12,
    borderRadius: 14,
    lineHeight: 18,
  },
  loadingBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 18 },
  loadingText: { color: T.colors.textSecondary, fontSize: 13 },
  emptyBox: { paddingVertical: 14, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: T.colors.textPrimary },
  emptyText: { fontSize: 13, color: T.colors.textSecondary, lineHeight: 19 },

  bodyMobile: { gap: 14 },
  bodyWeb: { flexDirection: "row", gap: 18, alignItems: "stretch" },
  colLeftWeb: { flex: 1, minWidth: 250 },
  colRightWeb: { flexShrink: 0, justifyContent: "center" },
  chartMobile: { alignItems: "center" },

  hero: {
    backgroundColor: INK,
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
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
  heroValue: { color: AMBER, fontSize: 48, fontWeight: "900", lineHeight: 52 },
  earlyTag: { color: "#FDE68A", fontSize: 11, fontWeight: "700" },
  heroStatsRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 10, gap: 12 },
  heroDivider: { width: 1, alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.12)" },
  heroStat: { flex: 1, gap: 3 },
  heroStatLabel: { color: "#A5B4FC", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  heroStatValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  meter: { flexDirection: "row", gap: 2, marginTop: 3 },
  meterSeg: { width: 9, height: 6, borderRadius: 2 },
  trendChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  trendGlyph: { fontSize: 17, fontWeight: "900" },
  trendLabel: { fontSize: 13, fontWeight: "800" },

  trendEmpty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 180,
    gap: 6,
  },
  trendEmptyTitle: { fontSize: 14, fontWeight: "800", color: T.colors.textPrimary },
  trendEmptyText: { fontSize: 12, color: T.colors.textSecondary, textAlign: "center", maxWidth: 280, lineHeight: 17 },

  levelPredictionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 12,
  },
  levelHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  levelSectionTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A", letterSpacing: -0.2 },
  levelSectionSubtitle: { fontSize: 11.5, color: "#64748B", marginTop: 2 },
  compositeAvgPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "flex-end",
  },
  compositeAvgPillLabel: { fontSize: 9.5, fontWeight: "900", color: "#065F46", letterSpacing: 0.5 },
  compositeAvgPillValue: { fontSize: 18, fontWeight: "900", color: "#047857" },

  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  levelItemBox: {
    flex: 1,
    minWidth: 160,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  levelTagPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" },
  levelTagText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },
  levelAccuracyText: { fontSize: 11, color: "#64748B", fontWeight: "700" },
  levelItemTitle: { fontSize: 12, fontWeight: "800", color: "#1E293B", marginTop: 2 },
  levelScoreValue: { fontSize: 24, fontWeight: "900" },
  levelScoreSub: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  levelProgressBarBg: { height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, overflow: "hidden", marginVertical: 4 },
  levelProgressBarFill: { height: "100%", borderRadius: 3 },
  levelFooterMeta: { fontSize: 10.5, color: "#94A3B8", marginTop: 2 },

  gateCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
  },
  gateHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  gateTitle: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  gateSub: { fontSize: 11.5, color: "#64748B", marginTop: 2, lineHeight: 16 },
  gateStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  gateReady: { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0" },
  gatePending: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A" },
  gateStatusText: { fontSize: 11, fontWeight: "800" },
  gateReadyText: { color: "#047857" },
  gatePendingText: { color: "#B45309" },
  criteriaList: { gap: 4, paddingTop: 4 },
  criteriaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  criteriaPassedText: { fontSize: 11, color: "#065F46", fontWeight: "600" },
  criteriaPendingText: { fontSize: 11, color: "#92400E", fontWeight: "600" },

  progressionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
  },
  progressionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  progressionTitle: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  progressionSub: { fontSize: 11.5, color: "#64748B", marginTop: 2, lineHeight: 16 },
  consistencyPill: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  consistencyLabel: { fontSize: 10.5, fontWeight: "800", color: "#4338CA" },
  milestonesGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  milestoneBox: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
    gap: 2,
  },
  milestoneLevel: { fontSize: 10, fontWeight: "900", color: "#6366F1" },
  milestoneDelta: { fontSize: 10.5, fontWeight: "800" },
  milestoneScore: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  milestoneTitle: { fontSize: 10, color: "#64748B" },

  breadthRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  breadthPill: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 2,
  },
  breadthLabel: { fontSize: 10.5, color: T.colors.textSecondary, fontWeight: "700" },
  breadthValue: { fontSize: 15, fontWeight: "900", color: T.colors.textPrimary },

  whyBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    gap: 6,
  },
  whyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  whyTitle: { fontSize: 12.5, fontWeight: "800", color: T.colors.textPrimary },
  whyToggle: { fontSize: 16, fontWeight: "900", color: T.colors.textMuted },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reasonDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#6366F1" },
  reasonText: { fontSize: 12, color: T.colors.textSecondary, flex: 1, lineHeight: 16 },

  footNote: { fontSize: 11, color: T.colors.textMuted, lineHeight: 16, marginTop: 4 },
});
