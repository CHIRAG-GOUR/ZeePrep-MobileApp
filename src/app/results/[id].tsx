import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getStudentReport } from "../../services/firestore";
import type { Report } from "../../types";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  ChevronLeft,
  Home,
  HelpCircle,
  TrendingUp,
} from "lucide-react-native";

import {
  generateTeacherAIReportAnalysis,
  analyzeWrongAnswerWithGemini,
  type ReportInsightResult,
  type WrongAnswerAnalysisResult,
} from "../../services/ai";
import { Sparkles, Brain, AlertTriangle, Lightbulb } from "lucide-react-native";

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [report, setReport] = useState<Report | null>(null);
  const [aiInsight, setAiInsight] = useState<ReportInsightResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      if (!id || !user) return;
      setLoading(true);
      const data = await getStudentReport(id as string, user.uid);
      setReport(data);
      setLoading(false);

      if (data) {
        if ((data as any).aiInsight) {
          setAiInsight((data as any).aiInsight);
        } else {
          setAiLoading(true);
          try {
            const insight = await generateTeacherAIReportAnalysis(data);
            setAiInsight(insight);
          } catch (e) {
            console.warn("AI Report insight error:", e);
          } finally {
            setAiLoading(false);
          }
        }
      }
    }

    loadReport();
  }, [id, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#818CF8" />
        <Text style={styles.loadingText}>Generating Performance Report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Report not found or not yet processed.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace("/(tabs)")}>
          <Home color="#FFFFFF" size={18} />
          <Text style={styles.backHomeText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mins = Math.floor((report.timeSpentSeconds || 0) / 60);
  const secs = (report.timeSpentSeconds || 0) % 60;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.replace("/(tabs)")}>
          <ChevronLeft color="#F8FAFC" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Examination Scorecard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Hero Card */}
        <View style={[styles.heroCard, report.passed ? styles.heroPassed : styles.heroFailed]}>
          <View style={styles.passBadge}>
            <Text style={[styles.passBadgeText, report.passed ? styles.textPassed : styles.textFailed]}>
              {report.passed ? "PASSED" : "NEEDS IMPROVEMENT"}
            </Text>
          </View>

          <Text style={styles.scoreText}>
            {report.obtainedMarks} <Text style={styles.totalScoreText}>/ {report.totalMarks}</Text>
          </Text>
          <Text style={styles.examTitle}>{report.examTitle}</Text>

          <View style={styles.percentagePill}>
            <Award color="#F59E0B" size={18} />
            <Text style={styles.percentageText}>{report.percentage}% Score</Text>
          </View>
        </View>

        {/* Diagnostics Grid */}
        <Text style={styles.sectionTitle}>Performance Analytics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Target color="#818CF8" size={22} />
            <Text style={styles.statVal}>{report.totalQuestions}</Text>
            <Text style={styles.statLbl}>Total Questions</Text>
          </View>

          <View style={styles.statCard}>
            <Award color="#4F46E5" size={22} />
            <Text style={styles.statVal}>{report.totalMarks}</Text>
            <Text style={styles.statLbl}>Total Possible Marks</Text>
          </View>

          <View style={styles.statCard}>
            <CheckCircle2 color="#10B981" size={22} />
            <Text style={styles.statVal}>{report.correctAnswers}</Text>
            <Text style={styles.statLbl}>Correct ({report.obtainedMarks} Marks)</Text>
          </View>

          <View style={styles.statCard}>
            <XCircle color="#EF4444" size={22} />
            <Text style={styles.statVal}>{report.incorrectAnswers}</Text>
            <Text style={styles.statLbl}>Incorrect (0 Marks)</Text>
          </View>
        </View>

        {/* Time Spent */}
        <View style={styles.timeCard}>
          <Clock color="#818CF8" size={20} />
          <View style={styles.timeContent}>
            <Text style={styles.timeLbl}>Total Time Spent & Accuracy</Text>
            <Text style={styles.timeVal}>
              {mins} mins {secs} secs • {report.accuracy}% Accuracy
            </Text>
          </View>
        </View>

        {/* Question-by-Question Detailed Analysis (Requirement 12, 13, 14) */}
        <Text style={styles.sectionTitle}>Question-by-Question Analysis</Text>
        {report.detailedAnalysis && report.detailedAnalysis.length > 0 ? (
          <View style={styles.questionAnalysisContainer}>
            {report.detailedAnalysis.map((qItem, qIdx) => {
              const isAnsEmpty = !qItem.studentAnswer || String(qItem.studentAnswer).trim() === "";
              const isCorrect = Boolean(qItem.isCorrect);
              const qWeight = qItem.marks !== undefined && qItem.marks !== null ? qItem.marks : 1;
              const awarded = isCorrect ? qWeight : 0;

              return (
                <View
                  key={qItem.questionId || qIdx}
                  style={[
                    styles.qAnalysisCard,
                    isCorrect
                      ? styles.qCardCorrect
                      : isAnsEmpty
                      ? styles.qCardUnattempted
                      : styles.qCardIncorrect,
                  ]}
                >
                  {/* Card Top Row: Question # and Result Pill */}
                  <View style={styles.qCardHeader}>
                    <Text style={styles.qNumberText}>Question {qIdx + 1}</Text>
                    <View
                      style={[
                        styles.qResultPill,
                        isCorrect
                          ? styles.pillCorrect
                          : isAnsEmpty
                          ? styles.pillUnattempted
                          : styles.pillIncorrect,
                      ]}
                    >
                      <Text
                        style={[
                          styles.qResultText,
                          isCorrect
                            ? styles.pillTextCorrect
                            : isAnsEmpty
                            ? styles.pillTextUnattempted
                            : styles.pillTextIncorrect,
                        ]}
                      >
                        {isCorrect
                          ? `✓ Correct (+${awarded} / ${qWeight} ${qWeight === 1 ? "mark" : "marks"})`
                          : isAnsEmpty
                          ? `Unanswered (0 / ${qWeight} ${qWeight === 1 ? "mark" : "marks"})`
                          : `✕ Incorrect (0 / ${qWeight} ${qWeight === 1 ? "mark" : "marks"})`}
                      </Text>
                    </View>
                  </View>

                  {/* Question Text */}
                  <Text style={styles.qQuestionText}>{qItem.questionText}</Text>

                  {/* Answers & Time Metrics Row */}
                  <View style={styles.qMetricsRow}>
                    <View style={styles.qMetricBox}>
                      <Text style={styles.qMetricLabel}>Weight:</Text>
                      <Text style={[styles.qMetricValue, { color: "#4F46E5" }]}>
                        {qWeight} {qWeight === 1 ? "Mark" : "Marks"}
                      </Text>
                    </View>

                    <View style={styles.qMetricBox}>
                      <Text style={styles.qMetricLabel}>Awarded:</Text>
                      <Text
                        style={[
                          styles.qMetricValue,
                          isCorrect ? styles.valCorrect : styles.valIncorrect,
                        ]}
                      >
                        {isCorrect ? `+${awarded}` : "0"}
                      </Text>
                    </View>

                    <View style={styles.qMetricBox}>
                      <Text style={styles.qMetricLabel}>Your Ans:</Text>
                      <Text
                        style={[
                          styles.qMetricValue,
                          isCorrect ? styles.valCorrect : isAnsEmpty ? styles.valMuted : styles.valIncorrect,
                        ]}
                      >
                        {isAnsEmpty ? "—" : String(qItem.studentAnswer)}
                      </Text>
                    </View>

                    <View style={styles.qMetricBox}>
                      <Text style={styles.qMetricLabel}>Correct:</Text>
                      <Text style={[styles.qMetricValue, styles.valCorrect]}>
                        {String(qItem.correctAnswer)}
                      </Text>
                    </View>

                    <View style={styles.qMetricBox}>
                      <Text style={styles.qMetricLabel}>Time:</Text>
                      <Text style={styles.qMetricValue}>
                        {qItem.timeSpentSeconds || 0}s
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
            Question-level analysis data not available for this legacy attempt.
          </Text>
        )}

        {/* Real Gemini AI Diagnostic Analysis Card (Requirement 10) */}
        <Text style={styles.sectionTitle}>Gemini AI Diagnostic Insights</Text>
        <View style={styles.aiDiagnosticCard}>
          <View style={styles.aiHeaderRow}>
            <Sparkles size={18} color="#4F46E5" />
            <Text style={styles.aiDiagnosticTitle}>AI Conceptual Performance Analysis</Text>
          </View>

          {aiLoading ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator color="#4F46E5" size="small" />
              <Text style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                Analyzing answer telemetry with Gemini AI...
              </Text>
            </View>
          ) : aiInsight ? (
            <View style={{ gap: 10 }}>
              {Array.isArray(aiInsight.strongTopics) && aiInsight.strongTopics.length > 0 && (
                <View style={styles.aiTagSection}>
                  <Text style={styles.aiTagLabel}>STRONG TOPICS</Text>
                  <View style={styles.aiTagRow}>
                    {aiInsight.strongTopics.map((t, idx) => (
                      <View key={idx} style={styles.strongTag}>
                        <Text style={styles.strongTagText}>{typeof t === "string" ? t : String(t)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {Array.isArray(aiInsight.weakTopics) && aiInsight.weakTopics.length > 0 && (
                <View style={styles.aiTagSection}>
                  <Text style={styles.aiTagLabel}>WEAK TOPICS & REVISION FOCUS</Text>
                  <View style={styles.aiTagRow}>
                    {aiInsight.weakTopics.map((t, idx) => (
                      <View key={idx} style={styles.weakTag}>
                        <Text style={styles.weakTagText}>{typeof t === "string" ? t : String(t)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {Array.isArray(aiInsight.conceptualGaps) && aiInsight.conceptualGaps.length > 0 && (
                <View style={styles.aiTagSection}>
                  <Text style={styles.aiTagLabel}>CONCEPTUAL GAPS</Text>
                  <View style={styles.aiTagRow}>
                    {aiInsight.conceptualGaps.map((g, idx) => (
                      <View key={idx} style={styles.weakTag}>
                        <Text style={styles.weakTagText}>{typeof g === "string" ? g : String(g)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {Array.isArray(aiInsight.actionableAdvice) && aiInsight.actionableAdvice.length > 0 && (
                <View style={styles.aiTagSection}>
                  <Text style={styles.aiTagLabel}>ACTIONABLE ADVICE</Text>
                  {aiInsight.actionableAdvice.map((a, idx) => (
                    <View key={idx} style={styles.aiRecommendationBox}>
                      <Lightbulb size={14} color="#D97706" />
                      <Text style={styles.aiRecommendationText}>{typeof a === "string" ? a : String(a)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {aiInsight.recommendation && typeof aiInsight.recommendation === "string" && (
                <View style={styles.aiRecommendationBox}>
                  <Lightbulb size={16} color="#D97706" />
                  <Text style={styles.aiRecommendationText}>{aiInsight.recommendation}</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: "#64748B" }}>
              AI analysis is temporarily unavailable. Complete more exams to generate dynamic insights.
            </Text>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Home color="#FFFFFF" size={18} />
          <Text style={styles.homeBtnText}>Return to Student Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  backHomeBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backHomeText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  heroPassed: {
    backgroundColor: "#FFFFFF",
    borderColor: "#10B981",
  },
  heroFailed: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EF4444",
  },
  passBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
  passBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  textPassed: {
    color: "#059669",
  },
  textFailed: {
    color: "#DC2626",
  },
  scoreText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0F172A",
  },
  totalScoreText: {
    fontSize: 24,
    color: "#64748B",
    fontWeight: "600",
  },
  examTitle: {
    fontSize: 16,
    color: "#475569",
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  percentagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  percentageText: {
    color: "#D97706",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  statVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  statLbl: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 28,
  },
  timeContent: {
    marginLeft: 12,
  },
  timeLbl: {
    fontSize: 12,
    color: "#64748B",
  },
  timeVal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  homeBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  homeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  aiDiagnosticCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  aiDiagnosticTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  aiTagSection: {
    marginBottom: 8,
  },
  aiTagLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  aiTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  strongTag: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  strongTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  weakTag: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  weakTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E11D48",
  },
  aiRecommendationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 4,
  },
  aiRecommendationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
    lineHeight: 17,
  },
  questionAnalysisContainer: {
    gap: 12,
    marginBottom: 24,
  },
  qAnalysisCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  qCardCorrect: {
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  qCardIncorrect: {
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  qCardUnattempted: {
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  qCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  qNumberText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  qResultPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillCorrect: {
    backgroundColor: "#ECFDF5",
  },
  pillIncorrect: {
    backgroundColor: "#FEF2F2",
  },
  pillUnattempted: {
    backgroundColor: "#FFFBEB",
  },
  qResultText: {
    fontSize: 11,
    fontWeight: "800",
  },
  pillTextCorrect: {
    color: "#059669",
  },
  pillTextIncorrect: {
    color: "#E11D48",
  },
  pillTextUnattempted: {
    color: "#D97706",
  },
  qQuestionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 20,
    marginBottom: 12,
  },
  qMetricsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  qMetricBox: {
    alignItems: "flex-start",
  },
  qMetricLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  qMetricValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  valCorrect: {
    color: "#059669",
  },
  valIncorrect: {
    color: "#E11D48",
  },
  valMuted: {
    color: "#94A3B8",
  },
});
