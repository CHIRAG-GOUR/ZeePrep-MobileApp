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
import { getStudentReport, getStudyResources } from "../../services/firestore";
import type { Report } from "../../types";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  ChevronLeft,
  Home,
  Sparkles,
  Lightbulb,
  BookOpen,
  FileText,
  Video,
  ExternalLink,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
} from "lucide-react-native";

import {
  generateTeacherAIReportAnalysis,
  type ReportInsightResult,
} from "../../services/ai";
import { resolveOptionText } from "../../utils/answer-evaluator";
import {
  deriveFactualTopicBreakdown,
  matchResourcesLocally,
  filterEligibleResources,
  type WeakTopicAnalysis,
} from "../../services/weak-topic-resource-engine";
import {
  ResourceViewerModal,
  type ResourceItem,
} from "../../components/ResourceViewerModal";

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [report, setReport] = useState<Report | null>(null);
  const [aiInsight, setAiInsight] = useState<ReportInsightResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Weak topic resources state
  const [weakTopicsData, setWeakTopicsData] = useState<WeakTopicAnalysis[]>([]);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const isTeacherOrAdmin =
    user?.role === "teacher" || user?.role === "admin" || user?.role === "superadmin";

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      setLoading(true);
      console.log("[ZeePrep Results] Loading report for ID:", id, "userRole:", user?.role);

      // Retry up to 3 times with increasing delays to handle Firestore write propagation
      let data: Report | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        data = await getStudentReport(id as string, user?.uid);
        if (data) break;
        console.log(`[ZeePrep Results] Attempt ${attempt + 1} returned null, retrying in ${(attempt + 1) * 1500}ms...`);
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1500));
      }

      setReport(data);
      setLoading(false);

      if (data) {
        // Resolve weak topic insights
        if (Array.isArray(data.weakTopicInsights) && data.weakTopicInsights.length > 0) {
          // Double-check validation on cached/stored insights
          const studentCtx = {
            grade: data.grade || "10",
            subject: (data as any).subject || data.examTitle || "General",
            schoolId: (data as any).schoolId || "",
            section: data.section || "",
          };
          setWeakTopicsData(data.weakTopicInsights);
        } else {
          // Client-side fallback derivation if report was generated earlier
          try {
            const topicBreakdowns = deriveFactualTopicBreakdown(data);
            const weakItems = topicBreakdowns.filter((t) => t.isWeak);
            if (weakItems.length > 0) {
              const studentCtx = {
                grade: data.grade || "10",
                subject: (data as any).subject || data.examTitle || "General",
                schoolId: (data as any).schoolId || "",
                section: data.section || "",
              };
              const availableResources = await getStudyResources(user, (data as any).subject);
              const eligibleResources = filterEligibleResources(availableResources, studentCtx);
              const derived: WeakTopicAnalysis[] = weakItems.map((wt) => ({
                topic: wt.topic,
                accuracy: wt.accuracy,
                totalQuestions: wt.totalQuestions,
                correctCount: wt.correctCount,
                wrongCount: wt.wrongCount,
                unansweredCount: wt.unansweredCount,
                diagnosis: `Needs structured practice and concept review in ${wt.topic} (${wt.accuracy}% accuracy).`,
                evidence: wt.incorrectQuestions.map((iq) => `Missed Question ${iq.questionNumber}`),
                recommendedResources: matchResourcesLocally(wt, eligibleResources),
              }));
              setWeakTopicsData(derived);
            }
          } catch (deriveErr) {
            console.warn("[ZeePrep Results] Notice deriving local weak topics:", deriveErr);
          }
        }

        // ONLY generate/fetch AI analysis for authorized Teacher/Admin screens
        if (isTeacherOrAdmin) {
          if ((data as any).aiInsight) {
            setAiInsight((data as any).aiInsight);
          } else {
            setAiLoading(true);
            try {
              const insight = await generateTeacherAIReportAnalysis(data);
              setAiInsight(insight);
            } catch (e) {
              console.warn("Report insight error:", e);
            } finally {
              setAiLoading(false);
            }
          }
        }
      }
    }

    loadReport();
  }, [id, user, isTeacherOrAdmin]);

  const handleOpenResource = (res: any) => {
    setSelectedResource({
      id: res.resourceId || res.id,
      title: res.title,
      url: res.url,
      type: res.type || "pdf",
      format: res.type || "pdf",
      displayType: (res.type || "pdf").toUpperCase(),
      subject: (report as any)?.subject || report?.examTitle || "Study Material",
    });
    setViewerVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
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
          <ChevronLeft color="#0F172A" size={24} />
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

        {/* AI Suggested Resources for Weak Topics */}
        <View style={styles.sectionHeaderRow}>
          <Sparkles size={18} color="#6366F1" />
          <Text style={styles.sectionTitleWithoutMargin}>Identified Weak Areas & Recommended Resources</Text>
        </View>

        {weakTopicsData.length > 0 ? (
          <View style={styles.weakTopicsContainer}>
            {weakTopicsData.map((wt, wtIdx) => (
              <View key={wtIdx} style={styles.weakTopicCard}>
                <View style={styles.weakTopicHeader}>
                  <View style={styles.weakTopicTitleCol}>
                    <Text style={styles.weakTopicTitle}>{wt.topic}</Text>
                    <Text style={styles.weakTopicStats}>
                      {wt.correctCount} / {wt.totalQuestions} Correct • Accuracy: {wt.accuracy}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.accuracyPill,
                      { backgroundColor: wt.accuracy < 40 ? "#FEF2F2" : "#FFFBEB" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.accuracyPillText,
                        { color: wt.accuracy < 40 ? "#DC2626" : "#D97706" },
                      ]}
                    >
                      {wt.accuracy}%
                    </Text>
                  </View>
                </View>

                {wt.diagnosis ? (
                  <View style={styles.diagnosisBox}>
                    <AlertTriangle size={14} color="#D97706" />
                    <Text style={styles.diagnosisText}>{wt.diagnosis}</Text>
                  </View>
                ) : null}

                {/* Recommended Real ZeePrep Resources */}
                <Text style={styles.resourceSectionLabel}>RECOMMENDED STUDY MATERIAL</Text>

                {wt.recommendedResources && wt.recommendedResources.length > 0 ? (
                  <View style={styles.resourcesStack}>
                    {wt.recommendedResources.map((res, rIdx) => {
                      const resType = (res.type || "pdf").toLowerCase();
                      const isVideo = resType.includes("video") || (res.url && (res.url.includes("youtube") || res.url.includes("youtu.be")));
                      return (
                        <TouchableOpacity
                          key={rIdx}
                          style={styles.resourceCard}
                          onPress={() => handleOpenResource(res)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.resourceIconBox}>
                            {isVideo ? (
                              <Video size={18} color="#6366F1" />
                            ) : (
                              <FileText size={18} color="#6366F1" />
                            )}
                          </View>

                          <View style={styles.resourceInfo}>
                            <View style={styles.resourceBadgeRow}>
                              <View style={styles.resourceTypeBadge}>
                                <Text style={styles.resourceTypeBadgeText}>
                                  {resType.toUpperCase()}
                                </Text>
                              </View>
                              {res.relevance === "high" && (
                                <View style={styles.highRelevanceBadge}>
                                  <Text style={styles.highRelevanceText}>TOP MATCH</Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.resourceTitle} numberOfLines={2}>
                              {res.title}
                            </Text>

                            {res.reason ? (
                              <Text style={styles.resourceReason} numberOfLines={2}>
                                {res.reason}
                              </Text>
                            ) : null}
                          </View>

                          <View style={styles.resourceActionBtn}>
                            <PlayCircle size={20} color="#4F46E5" />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.noResourcesBox}>
                    <View style={styles.noResourcesIconBox}>
                      <HelpCircle size={18} color="#6366F1" />
                    </View>
                    <View style={styles.noResourcesContent}>
                      <Text style={styles.noResourcesTitle}>
                        Ask teacher to upload the resource or provide it.
                      </Text>
                      <Text style={styles.noResourcesSubtitle}>
                        This topic ({wt.topic}) is not given or sufficiently explained in current uploaded materials.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.masteryCard}>
            <CheckCircle2 size={24} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.masteryTitle}>Strong Conceptual Mastery</Text>
              <Text style={styles.masterySubtitle}>
                No critical weak areas were identified on this assessment. Keep up the outstanding work!
              </Text>
            </View>
          </View>
        )}

        {/* Factual Question Analysis (100% Responsive Vertical Stack) */}
        <Text style={styles.sectionTitle}>Question Analysis</Text>

        {report.detailedAnalysis && report.detailedAnalysis.length > 0 ? (
          <View style={styles.questionStack}>
            {report.detailedAnalysis.map((qItem, qIdx) => {
              const isAnsEmpty =
                !qItem.studentAnswer || String(qItem.studentAnswer).trim() === "";
              const isCorrect = Boolean(qItem.isCorrect);
              const qWeight =
                qItem.marks !== undefined && qItem.marks !== null ? qItem.marks : 1;
              const awarded = isCorrect ? qWeight : 0;

              const resolvedStudent = isAnsEmpty
                ? "― Unanswered"
                : resolveOptionText(qItem.studentAnswer, qItem, true);
              const resolvedCorrect = resolveOptionText(qItem.correctAnswer, qItem, true);

              return (
                <View
                  key={qItem.questionId || qIdx}
                  style={[
                    styles.qCard,
                    isCorrect
                      ? styles.qCardCorrect
                      : isAnsEmpty
                      ? styles.qCardUnattempted
                      : styles.qCardIncorrect,
                  ]}
                >
                  {/* Card Header */}
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
                          ? `― Unanswered (0 / ${qWeight} ${qWeight === 1 ? "mark" : "marks"})`
                          : `✕ Wrong (0 / ${qWeight} ${qWeight === 1 ? "mark" : "marks"})`}
                      </Text>
                    </View>
                  </View>

                  {/* Question Prompt */}
                  <Text style={styles.fieldLabel}>Question:</Text>
                  <Text style={styles.questionPromptText}>{qItem.questionText}</Text>

                  {/* Student Answer */}
                  <Text style={styles.fieldLabel}>Your Answer:</Text>
                  <Text
                    style={[
                      styles.answerValueText,
                      isCorrect
                        ? styles.ansCorrect
                        : isAnsEmpty
                        ? styles.ansMuted
                        : styles.ansIncorrect,
                    ]}
                  >
                    {resolvedStudent}
                  </Text>

                  {/* Correct Answer */}
                  <Text style={styles.fieldLabel}>Correct Answer:</Text>
                  <Text style={[styles.answerValueText, styles.ansCorrect]}>
                    {resolvedCorrect}
                  </Text>

                  {/* Card Footer Metrics */}
                  <View style={styles.qFooterRow}>
                    <Text style={styles.qFooterText}>
                      Time Taken: {qItem.timeSpentSeconds || 0} sec
                    </Text>
                    <Text style={styles.qFooterText}>
                      Marks: {awarded} / {qWeight}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
            Question-level analysis data unavailable.
          </Text>
        )}

        {/* Teacher/Admin Only Diagnostic Section (Requirement 7) */}
        {isTeacherOrAdmin ? (
          <>
            <Text style={styles.sectionTitle}>Faculty Diagnostic Insights</Text>
            <View style={styles.aiDiagnosticCard}>
              <View style={styles.aiHeaderRow}>
                <Sparkles size={18} color="#4F46E5" />
                <Text style={styles.aiDiagnosticTitle}>Faculty Performance Analysis</Text>
              </View>

              {aiLoading ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <ActivityIndicator color="#4F46E5" size="small" />
                  <Text style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                    Evaluating diagnostic telemetry...
                  </Text>
                </View>
              ) : aiInsight ? (
                <View style={{ gap: 10 }}>
                  {Array.isArray(aiInsight.strongTopics) && aiInsight.strongTopics.length > 0 && (
                    <View style={styles.aiTagSection}>
                      <Text style={styles.aiTagLabel}>STRONG TOPICS</Text>
                      <View style={styles.aiTagRow}>
                        {aiInsight.strongTopics.map((t: string, idx: number) => (
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
                        {aiInsight.weakTopics.map((t: string, idx: number) => (
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
                        {aiInsight.conceptualGaps.map((g: string, idx: number) => (
                          <View key={idx} style={styles.weakTag}>
                            <Text style={styles.weakTagText}>{typeof g === "string" ? g : String(g)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {Array.isArray(aiInsight.actionableAdvice) && aiInsight.actionableAdvice.length > 0 && (
                    <View style={styles.aiTagSection}>
                      <Text style={styles.aiTagLabel}>ACTIONABLE RECOMMENDATIONS</Text>
                      {aiInsight.actionableAdvice.map((a: string, idx: number) => (
                        <View key={idx} style={styles.aiRecommendationBox}>
                          <Lightbulb size={14} color="#D97706" />
                          <Text style={styles.aiRecommendationText}>{typeof a === "string" ? a : String(a)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={{ fontSize: 13, color: "#64748B" }}>
                  Diagnostic analysis unavailable for this assessment paper.
                </Text>
              )}
            </View>
          </>
        ) : null}

        {/* Action Button */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Home color="#FFFFFF" size={18} />
          <Text style={styles.homeBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Resource Viewer Modal for In-App Preview */}
      <ResourceViewerModal
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        resource={selectedResource}
      />
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
    padding: 16,
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
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  sectionTitleWithoutMargin: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  weakTopicsContainer: {
    flexDirection: "column",
    gap: 14,
    marginBottom: 24,
  },
  weakTopicCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  weakTopicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  weakTopicTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  weakTopicTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  weakTopicStats: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  accuracyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accuracyPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  diagnosisBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 4,
    marginBottom: 12,
  },
  diagnosisText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
    lineHeight: 17,
  },
  resourceSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6366F1",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  resourcesStack: {
    gap: 8,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resourceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  resourceInfo: {
    flex: 1,
    marginRight: 8,
  },
  resourceBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  resourceTypeBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resourceTypeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#4338CA",
  },
  highRelevanceBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highRelevanceText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#15803D",
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  resourceReason: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  resourceActionBtn: {
    padding: 4,
  },
  noResourcesBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 3,
    borderLeftColor: "#6366F1",
    gap: 10,
  },
  noResourcesIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  noResourcesContent: {
    flex: 1,
  },
  noResourcesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  noResourcesSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  masteryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginBottom: 24,
  },
  masteryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#065F46",
  },
  masterySubtitle: {
    fontSize: 12,
    color: "#047857",
    marginTop: 2,
    lineHeight: 16,
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
    marginBottom: 24,
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
    marginTop: 12,
  },
  homeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  questionStack: {
    flexDirection: "column",
    gap: 14,
    marginBottom: 24,
  },
  qCard: {
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
    borderColor: "rgba(16, 185, 129, 0.4)",
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  qCardIncorrect: {
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  qCardUnattempted: {
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  qCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  qNumberText: {
    fontSize: 15,
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
    fontSize: 12,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 2,
  },
  questionPromptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 20,
    marginBottom: 4,
  },
  answerValueText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 4,
  },
  ansCorrect: {
    color: "#059669",
  },
  ansIncorrect: {
    color: "#DC2626",
  },
  ansMuted: {
    color: "#94A3B8",
  },
  qFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  qFooterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
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
});
