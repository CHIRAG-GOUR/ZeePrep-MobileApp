import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import {
  getStudentReport,
  getStudyResources,
  saveTeacherReviewToReport,
} from "../../services/firestore";
import type { Report, TeacherReview } from "../../types";
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
  FileText,
  Video,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Edit3,
  Save,
  MessageSquare,
  Check,
  RefreshCw,
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
import BoardForecastCard from "../../components/BoardForecastCard";
import { getBoardForecastForSubject } from "../../services/firestore";
import type {
  SubjectAssessmentProfile,
  BoardForecastSnapshot,
  SubjectForecastRecord,
} from "../../types/forecast";
import ReportPdfButton from "../../components/ReportPdfButton";

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const [report, setReport] = useState<Report | null>(null);
  const [aiInsight, setAiInsight] = useState<ReportInsightResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Weak topic resources state
  const [weakTopicsData, setWeakTopicsData] = useState<WeakTopicAnalysis[]>([]);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  // Teacher Remarks & Review State
  const [overallRemark, setOverallRemark] = useState("");
  const [topicRemarks, setTopicRemarks] = useState<Record<string, string>>({});
  const [questionRemarks, setQuestionRemarks] = useState<Record<string, string>>({});
  const [isEditingAi, setIsEditingAi] = useState(false);
  const [editedAiReviewPointers, setEditedAiReviewPointers] = useState("");
  const [editedAiWeakTopics, setEditedAiWeakTopics] = useState("");
  const [editedAiStrongTopics, setEditedAiStrongTopics] = useState("");
  const [editedAiGaps, setEditedAiGaps] = useState("");
  const [editedAiAdvice, setEditedAiAdvice] = useState("");
  const [isAiEditedByTeacher, setIsAiEditedByTeacher] = useState(false);

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isTeacherOrAdmin =
    user?.role === "teacher" || user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdminOrAdmin = user?.role === "superadmin" || user?.role === "admin";
  const [presentationMode, setPresentationMode] = useState<"student" | "faculty">(
    user?.role === "student" ? "student" : "faculty"
  );

  // ── Board Preparation Forecast (additive; report stays usable if this fails) ──
  const [forecastSnap, setForecastSnap] = useState<BoardForecastSnapshot | null>(null);
  const [forecastProfile, setForecastProfile] = useState<SubjectAssessmentProfile | null>(null);
  const [forecastRecord, setForecastRecord] = useState<SubjectForecastRecord | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadForecast() {
      if (!report || !report.studentId || !report.subject) return;
      setForecastLoading(true);
      try {
        const res = await getBoardForecastForSubject(report.studentId, {
          subject: report.subject as string,
          grade: report.grade,
          board: report.board,
        });
        if (!cancelled) {
          setForecastSnap(res.snapshot);
          setForecastProfile(res.profile);
          setForecastRecord(res.record);
        }
      } catch (e) {
        console.warn("[ZeePrep] Forecast load notice (report still usable):", e);
      } finally {
        if (!cancelled) setForecastLoading(false);
      }
    }
    loadForecast();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, report?.studentId, report?.subject]);

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
        // Initialize Teacher Review and Remarks if present
        const tr = data.teacherReview;
        if (tr) {
          setOverallRemark(tr.overallRemark || data.teacherRemarks || "");
          setTopicRemarks(tr.topicRemarks || {});
          setQuestionRemarks(tr.questionRemarks || {});
          if (tr.updatedAt) {
            setLastSavedTime(
              new Date(tr.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            );
          }
        } else if (data.teacherRemarks) {
          setOverallRemark(data.teacherRemarks);
        }

        // Resolve weak topic insights
        if (Array.isArray(data.weakTopicInsights) && data.weakTopicInsights.length > 0) {
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

        // Handle AI Analysis for Teacher / Admin
        if (isTeacherOrAdmin) {
          // Check if teacher has previously edited AI insights
          if (tr?.aiInsights?.editedByTeacher && tr.aiInsights.current) {
            const currentInsight = tr.aiInsights.current;
            setAiInsight(currentInsight);
            setIsAiEditedByTeacher(true);
            setEditedAiReviewPointers(
              Array.isArray(currentInsight.reviewPointers) ? currentInsight.reviewPointers.join("\n") : ""
            );
            setEditedAiWeakTopics(
              Array.isArray(currentInsight.weakTopics) ? currentInsight.weakTopics.join(", ") : ""
            );
            setEditedAiStrongTopics(
              Array.isArray(currentInsight.strongTopics) ? currentInsight.strongTopics.join(", ") : ""
            );
            setEditedAiGaps(
              Array.isArray(currentInsight.conceptualGaps) ? currentInsight.conceptualGaps.join("\n") : ""
            );
            setEditedAiAdvice(
              Array.isArray(currentInsight.actionableAdvice) ? currentInsight.actionableAdvice.join("\n") : ""
            );
          } else if ((data as any).aiInsight) {
            const insight = (data as any).aiInsight;
            setAiInsight(insight);
            setEditedAiReviewPointers(
              Array.isArray(insight.reviewPointers) ? insight.reviewPointers.join("\n") : ""
            );
            setEditedAiWeakTopics(
              Array.isArray(insight.weakTopics) ? insight.weakTopics.join(", ") : ""
            );
            setEditedAiStrongTopics(
              Array.isArray(insight.strongTopics) ? insight.strongTopics.join(", ") : ""
            );
            setEditedAiGaps(
              Array.isArray(insight.conceptualGaps) ? insight.conceptualGaps.join("\n") : ""
            );
            setEditedAiAdvice(
              Array.isArray(insight.actionableAdvice) ? insight.actionableAdvice.join("\n") : ""
            );
          } else {
            // Generate AI insights once if not already saved
            setAiLoading(true);
            try {
              const insight = await generateTeacherAIReportAnalysis(data);
              setAiInsight(insight);
              setEditedAiReviewPointers(
                Array.isArray(insight.reviewPointers) ? insight.reviewPointers.join("\n") : ""
              );
              setEditedAiWeakTopics(
                Array.isArray(insight.weakTopics) ? insight.weakTopics.join(", ") : ""
              );
              setEditedAiStrongTopics(
                Array.isArray(insight.strongTopics) ? insight.strongTopics.join(", ") : ""
              );
              setEditedAiGaps(
                Array.isArray(insight.conceptualGaps) ? insight.conceptualGaps.join("\n") : ""
              );
              setEditedAiAdvice(
                Array.isArray(insight.actionableAdvice) ? insight.actionableAdvice.join("\n") : ""
              );
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
    if (!res || (!res.url && !res.resourceId && !res.id)) {
      Alert.alert("Resource Unavailable", "The requested study resource could not be found or has an invalid link.");
      return;
    }
    setSelectedResource({
      id: res.resourceId || res.id,
      title: res.title || "Study Resource",
      url: res.url || "",
      type: res.type || "pdf",
      format: res.type || "pdf",
      displayType: (res.type || "pdf").toUpperCase(),
      subject: res.subject || (report as any)?.subject || report?.examTitle || "Study Material",
    });
    setViewerVisible(true);
  };

  const handleSaveTeacherReview = async () => {
    if (!report || !user) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Build structured current AI insights
      const currentAiStructure: ReportInsightResult = {
        reviewPointers: editedAiReviewPointers
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        strongTopics: editedAiStrongTopics
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        weakTopics: editedAiWeakTopics
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        conceptualGaps: editedAiGaps
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        actionableAdvice: editedAiAdvice
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        recommendation: editedAiAdvice.trim() || aiInsight?.recommendation || "Focus on targeted practice for identified weak areas.",
      };

      const reviewPayload: TeacherReview = {
        overallRemark: overallRemark.trim(),
        topicRemarks,
        questionRemarks,
        aiInsights: {
          original: report.teacherReview?.aiInsights?.original || aiInsight || {},
          current: currentAiStructure,
          editedByTeacher: true,
          editedBy: user.uid,
          editedByName: user.name || "Faculty Member",
          editedAt: new Date().toISOString(),
          aiModel: "gemini-2.5-flash",
        },
      };

      const res = await saveTeacherReviewToReport(report.id, reviewPayload, user);

      if (res.success) {
        setIsAiEditedByTeacher(true);
        setIsEditingAi(false);
        setAiInsight(currentAiStructure);
        setHasUnsavedChanges(false);
        const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSavedTime(timeNow);
        setSaveMessage({ type: "success", text: `✓ Changes saved permanently (${timeNow})` });
        if (res.updatedReport) setReport(res.updatedReport);
      } else {
        setSaveMessage({ type: "error", text: res.error || "Unable to save changes. Please try again." });
      }
    } catch (err: any) {
      console.error("Save teacher review exception:", err);
      setSaveMessage({ type: "error", text: err?.message || "Failed to save teacher review to Firebase." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackNavigation = () => {
    if (hasUnsavedChanges && isFacultyViewActive) {
      Alert.alert(
        "Unsaved Changes",
        "You have modified teacher remarks or AI insights. Do you want to save before leaving?",
        [
          { text: "Discard", style: "destructive", onPress: () => router.back() },
          { text: "Save Now", onPress: () => handleSaveTeacherReview() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Academic Report...</Text>
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

  const isFacultyViewActive = isTeacherOrAdmin && presentationMode === "faculty";

  // Calculations & Formatters
  const totalQuestions = report.totalQuestions || 0;
  const correctCount = report.correctAnswers || 0;
  const wrongCount = report.incorrectAnswers || 0;
  const unansweredCount =
    (report as any).unansweredCount !== undefined
      ? (report as any).unansweredCount
      : Math.max(0, totalQuestions - (correctCount + wrongCount));
  const attemptedCount = correctCount + wrongCount;

  const totalSecs = Math.max(0, report.timeSpentSeconds || 0);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const totalTimeDisplay = mins > 0 ? `${mins} min${secs > 0 ? ` ${secs}s` : ""}` : `${secs}s`;

  const avgSecsPerQ = totalQuestions > 0 ? Math.round(totalSecs / totalQuestions) : 0;
  const avgMins = Math.floor(avgSecsPerQ / 60);
  const avgSecs = avgSecsPerQ % 60;
  const avgTimeDisplay = avgMins > 0 ? `${avgMins}m ${avgSecs}s` : `${avgSecs}s`;

  // Performance Rating calculation
  const percentage = report.percentage || 0;
  const performanceLabel =
    percentage >= 85
      ? "Excellent Performance"
      : percentage >= 70
      ? "Good Performance"
      : percentage >= 50
      ? "Satisfactory Performance"
      : "Needs Revision";

  // Format date
  const submittedDate = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const subjectName = (report.subject || (report as any).examSubject || "Academic Assessment").toUpperCase();
  const forecastWidth = Math.max(
    260,
    (isDesktopWeb ? Math.min(1200, width) - 64 : width - 24) - 32
  );
  const examTitleName = report.examTitle || "Chapter Assessment";
  const gradeDisplay = report.grade
    ? report.grade.toLowerCase().includes("class") || report.grade.toLowerCase().includes("grade")
      ? report.grade
      : `Class ${report.grade}`
    : "Class 10";

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleBackNavigation}>
          <ChevronLeft color="#0F172A" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFacultyViewActive ? "Faculty Detailed Report" : "Academic Report Card"}
        </Text>
        <ReportPdfButton
          compact
          report={report}
          forecast={forecastSnap}
          profile={forecastProfile}
          record={forecastRecord}
          variant={isFacultyViewActive ? "teacher" : "student"}
        />
      </View>

      {/* SuperAdmin / Admin View Mode Switcher */}
      {isSuperAdminOrAdmin && (
        <View style={styles.presentationToggleRow}>
          <TouchableOpacity
            style={[
              styles.presentationTab,
              presentationMode === "student" && styles.presentationTabActive,
            ]}
            onPress={() => setPresentationMode("student")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.presentationTabText,
                presentationMode === "student" && styles.presentationTabTextActive,
              ]}
            >
              Student View
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presentationTab,
              presentationMode === "faculty" && styles.presentationTabActive,
            ]}
            onPress={() => setPresentationMode("faculty")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.presentationTabText,
                presentationMode === "faculty" && styles.presentationTabTextActive,
              ]}
            >
              Teacher / Detailed View
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && { maxWidth: 1200, alignSelf: "center", width: "100%", paddingHorizontal: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* VIEW 1: CLEAN ACADEMIC STUDENT REPORT CARD              */}
        {/* ======================================================== */}
        {!isFacultyViewActive ? (
          <View style={styles.studentReportCardContainer}>
            {/* 1. Exam Header & Hero Score */}
            <View style={styles.reportCardHero}>
              <Text style={styles.cardSubjectTag}>{subjectName}</Text>
              <Text style={styles.cardExamTitle}>{examTitleName}</Text>
              <Text style={styles.cardMetaSub}>
                {gradeDisplay} • {submittedDate}
              </Text>

              <View style={styles.heroScoreBox}>
                <Text style={styles.heroScoreText}>
                  {report.obtainedMarks} <Text style={styles.heroTotalText}>/ {report.totalMarks}</Text>
                </Text>
                <Text style={styles.heroPercentageText}>{percentage}%</Text>
              </View>

              <View
                style={[
                  styles.performancePill,
                  percentage >= 70
                    ? styles.pillGood
                    : percentage >= 50
                    ? styles.pillAverage
                    : styles.pillNeedsWork,
                ]}
              >
                <Text
                  style={[
                    styles.performancePillText,
                    percentage >= 70
                      ? styles.pillGoodText
                      : percentage >= 50
                      ? styles.pillAverageText
                      : styles.pillNeedsWorkText,
                  ]}
                >
                  {performanceLabel}
                </Text>
              </View>
            </View>

            {/* Board Preparation Forecast (student-facing) */}
            <BoardForecastCard
              variant="student"
              snapshot={forecastSnap}
              profile={forecastProfile}
              record={forecastRecord}
              loading={forecastLoading}
              isDesktopWeb={isDesktopWeb}
              width={forecastWidth}
            />

            {/* 2. Question Summary Table */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>QUESTION SUMMARY</Text>
              <View style={styles.summaryTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Total Questions</Text>
                  <Text style={styles.tableValue}>{totalQuestions}</Text>
                </View>
                <View style={styles.tableDivider} />
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Attempted</Text>
                  <Text style={styles.tableValue}>{attemptedCount}</Text>
                </View>
                <View style={styles.tableDivider} />
                <View style={styles.tableRow}>
                  <View style={styles.labelWithDot}>
                    <View style={[styles.dot, { backgroundColor: "#10B981" }]} />
                    <Text style={styles.tableLabel}>Correct</Text>
                  </View>
                  <Text style={[styles.tableValue, { color: "#059669", fontWeight: "800" }]}>
                    {correctCount}
                  </Text>
                </View>
                <View style={styles.tableDivider} />
                <View style={styles.tableRow}>
                  <View style={styles.labelWithDot}>
                    <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                    <Text style={styles.tableLabel}>Wrong</Text>
                  </View>
                  <Text style={[styles.tableValue, { color: "#DC2626", fontWeight: "800" }]}>
                    {wrongCount}
                  </Text>
                </View>
                <View style={styles.tableDivider} />
                <View style={styles.tableRow}>
                  <View style={styles.labelWithDot}>
                    <View style={[styles.dot, { backgroundColor: "#94A3B8" }]} />
                    <Text style={styles.tableLabel}>Unanswered</Text>
                  </View>
                  <Text style={[styles.tableValue, { color: "#64748B" }]}>
                    {unansweredCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Time Analysis */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>TIME ANALYSIS</Text>
              <View style={styles.timeSummaryGrid}>
                <View style={styles.timeSummaryBox}>
                  <Clock size={16} color="#6366F1" />
                  <Text style={styles.timeSummaryVal}>{totalTimeDisplay}</Text>
                  <Text style={styles.timeSummaryLbl}>Total Time</Text>
                </View>
                <View style={styles.timeSummaryBox}>
                  <Target size={16} color="#6366F1" />
                  <Text style={styles.timeSummaryVal}>{avgTimeDisplay}</Text>
                  <Text style={styles.timeSummaryLbl}>Avg / Question</Text>
                </View>
              </View>
              {report.mostTimeSpentTopic ? (
                <View style={styles.mostTimeSpentCard}>
                  <Text style={styles.mostTimeSpentLabel}>Most Time Spent On</Text>
                  <Text style={styles.mostTimeSpentValue}>{report.mostTimeSpentTopic}</Text>
                </View>
              ) : null}
            </View>

            {/* 4. Your Weak Topics */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>YOUR WEAK TOPICS</Text>
              {weakTopicsData.length > 0 ? (
                <View style={styles.weakTopicsList}>
                  {weakTopicsData.map((wt, idx) => (
                    <View key={idx} style={styles.weakTopicItem}>
                      <View style={styles.weakTopicHeaderRow}>
                        <Text style={styles.weakTopicName}>• {wt.topic}</Text>
                        <Text style={styles.weakTopicAccBadge}>{wt.accuracy}% Accuracy</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.masteryCard}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <Text style={styles.masteryText}>
                    Great job! No weak topics identified on this test.
                  </Text>
                </View>
              )}
            </View>

            {/* 5. Improve Your Weak Topics (Suggested Resources) */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>IMPROVE YOUR WEAK TOPICS</Text>
              {weakTopicsData.length > 0 ? (
                weakTopicsData.map((wt, wtIdx) => (
                  <View key={wtIdx} style={styles.resourceTopicGroup}>
                    <Text style={styles.resourceTopicTitle}>{wt.topic}</Text>
                    {wt.recommendedResources && wt.recommendedResources.length > 0 ? (
                      <View style={styles.resourcesStack}>
                        {wt.recommendedResources.map((res, rIdx) => {
                          const resType = (res.type || "pdf").toLowerCase();
                          const isVideo =
                            resType.includes("video") ||
                            (res.url && (res.url.includes("youtube") || res.url.includes("youtu.be")));
                          return (
                            <TouchableOpacity
                              key={rIdx}
                              style={styles.cleanResourceCard}
                              onPress={() => handleOpenResource(res)}
                              activeOpacity={0.85}
                            >
                              <View style={styles.cleanResourceIconBox}>
                                {isVideo ? (
                                  <Video size={16} color="#4F46E5" />
                                ) : (
                                  <FileText size={16} color="#4F46E5" />
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.cleanResourceTitle} numberOfLines={1}>
                                  {res.title}
                                </Text>
                                <Text style={styles.cleanResourceType}>
                                  {resType.toUpperCase()}
                                </Text>
                              </View>
                              <PlayCircle size={18} color="#4F46E5" />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.cleanNoResourceBox}>
                        <HelpCircle size={16} color="#94A3B8" />
                        <Text style={styles.cleanNoResourceText}>
                          Ask teacher to upload the resource or provide it.
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.allSetText}>You're all set! Review completed topics in your library.</Text>
              )}
            </View>
          </View>
        ) : (
          /* ======================================================== */
          /* VIEW 2: TEACHER / FACULTY DETAILED DIAGNOSTIC REPORT     */
          /* ======================================================== */
          <View style={styles.facultyReportContainer}>
            {/* Student Information Banner */}
            <View style={styles.studentInfoCard}>
              <View style={styles.studentInfoHeaderRow}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {(report.studentName || "S").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentInfoName}>{report.studentName || "Student"}</Text>
                  <Text style={styles.studentInfoSub}>
                    {report.studentEmail || "Enrolled Student"}
                  </Text>
                </View>
                <View style={styles.attemptPill}>
                  <Text style={styles.attemptPillText}>Attempt #{report.attemptNumber || 1}</Text>
                </View>
              </View>

              <View style={styles.studentMetaRow}>
                <View style={styles.studentMetaItem}>
                  <Text style={styles.studentMetaLabel}>Class / Grade</Text>
                  <Text style={styles.studentMetaVal}>{gradeDisplay}</Text>
                </View>
                <View style={styles.studentMetaItem}>
                  <Text style={styles.studentMetaLabel}>Section</Text>
                  <Text style={styles.studentMetaVal}>{report.section || "A"}</Text>
                </View>
                <View style={styles.studentMetaItem}>
                  <Text style={styles.studentMetaLabel}>Subject</Text>
                  <Text style={styles.studentMetaVal}>{report.subject || "General"}</Text>
                </View>
              </View>
            </View>

            {/* Performance Overview Grid */}
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Target color="#818CF8" size={20} />
                <Text style={styles.statVal}>
                  {report.obtainedMarks} / {report.totalMarks}
                </Text>
                <Text style={styles.statLbl}>Marks Obtained</Text>
              </View>

              <View style={styles.statCard}>
                <Award color="#4F46E5" size={20} />
                <Text style={styles.statVal}>{percentage}%</Text>
                <Text style={styles.statLbl}>Percentage</Text>
              </View>

              <View style={styles.statCard}>
                <CheckCircle2 color="#10B981" size={20} />
                <Text style={styles.statVal}>{report.accuracy}%</Text>
                <Text style={styles.statLbl}>Accuracy</Text>
              </View>

              <View style={styles.statCard}>
                <Clock color="#F59E0B" size={20} />
                <Text style={styles.statVal}>{totalTimeDisplay}</Text>
                <Text style={styles.statLbl}>Total Time</Text>
              </View>
            </View>

            {/* Question Telemetry Counts */}
            <View style={styles.countsRow}>
              <View style={styles.countBadge}>
                <Text style={styles.countNumber}>{totalQuestions}</Text>
                <Text style={styles.countLabel}>Total</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: "#ECFDF5" }]}>
                <Text style={[styles.countNumber, { color: "#059669" }]}>{correctCount}</Text>
                <Text style={styles.countLabel}>Correct</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: "#FEF2F2" }]}>
                <Text style={[styles.countNumber, { color: "#DC2626" }]}>{wrongCount}</Text>
                <Text style={styles.countLabel}>Wrong</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: "#F1F5F9" }]}>
                <Text style={[styles.countNumber, { color: "#64748B" }]}>{unansweredCount}</Text>
                <Text style={styles.countLabel}>Unanswered</Text>
              </View>
            </View>

            {/* Board Preparation Forecast (faculty diagnostics) */}
            <BoardForecastCard
              variant="teacher"
              snapshot={forecastSnap}
              profile={forecastProfile}
              record={forecastRecord}
              loading={forecastLoading}
              isDesktopWeb={isDesktopWeb}
              width={forecastWidth}
            />

            {/* 1. Editable AI Faculty Insights Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleWithoutMargin}>Faculty AI Insights</Text>
              <TouchableOpacity
                style={styles.editToggleBtn}
                onPress={() => {
                  setIsEditingAi(!isEditingAi);
                  setHasUnsavedChanges(true);
                }}
              >
                <Edit3 size={14} color="#4F46E5" />
                <Text style={styles.editToggleText}>
                  {isEditingAi ? "Done Editing" : "Edit Insights"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.aiDiagnosticCard}>
              <View style={styles.aiHeaderRow}>
                <Sparkles size={18} color="#4F46E5" />
                <Text style={styles.aiDiagnosticTitle}>Diagnostic Evaluation</Text>
                {isAiEditedByTeacher && (
                  <View style={styles.editedBadge}>
                    <Text style={styles.editedBadgeText}>Edited by Faculty</Text>
                  </View>
                )}
              </View>

              {aiLoading ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <ActivityIndicator color="#4F46E5" size="small" />
                  <Text style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                    Evaluating student telemetry...
                  </Text>
                </View>
              ) : isEditingAi ? (
                /* Editable Form Mode */
                <View style={styles.editableAiContainer}>
                  <Text style={styles.inputFieldLabel}>REVIEW POINTERS (One per line)</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.multilineInput]}
                    value={editedAiReviewPointers}
                    onChangeText={(t) => {
                      setEditedAiReviewPointers(t);
                      setHasUnsavedChanges(true);
                    }}
                    multiline
                    numberOfLines={4}
                    placeholder="e.g. Revise quadratic formula concepts&#10;Review multi-step calculation errors"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputFieldLabel}>WEAK TOPICS (Comma Separated)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editedAiWeakTopics}
                    onChangeText={(t) => {
                      setEditedAiWeakTopics(t);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="e.g. Linear Equations, Coordinate Geometry"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputFieldLabel}>STRONG TOPICS (Comma Separated)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editedAiStrongTopics}
                    onChangeText={(t) => {
                      setEditedAiStrongTopics(t);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="e.g. Real Numbers, Polynomials"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputFieldLabel}>CONCEPTUAL GAPS (One per line)</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.multilineInput]}
                    value={editedAiGaps}
                    onChangeText={(t) => {
                      setEditedAiGaps(t);
                      setHasUnsavedChanges(true);
                    }}
                    multiline
                    numberOfLines={3}
                    placeholder="e.g. Difficulty with multi-step equation balancing"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputFieldLabel}>TEACHING RECOMMENDATIONS (One per line)</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.multilineInput]}
                    value={editedAiAdvice}
                    onChangeText={(t) => {
                      setEditedAiAdvice(t);
                      setHasUnsavedChanges(true);
                    }}
                    multiline
                    numberOfLines={3}
                    placeholder="e.g. Assign 10 worksheet problems on linear equations"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              ) : aiInsight ? (
                /* Display View Mode */
                <View style={{ gap: 14 }}>
                  {/* Actionable Review Pointers */}
                  {Array.isArray(aiInsight.reviewPointers) && aiInsight.reviewPointers.length > 0 && (
                    <View style={styles.aiTagSection}>
                      <Text style={styles.aiTagLabel}>ACTIONABLE REVIEW POINTERS</Text>
                      <View style={styles.aiPointersList}>
                        {aiInsight.reviewPointers.map((pointer: string, pIdx: number) => (
                          <View key={pIdx} style={styles.aiPointerItem}>
                            <CheckCircle2 size={15} color="#4F46E5" style={{ marginTop: 2 }} />
                            <Text style={styles.aiPointerText}>{typeof pointer === "string" ? pointer : String(pointer)}</Text>
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
                      <Text style={styles.aiTagLabel}>TEACHING RECOMMENDATIONS</Text>
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
                  Diagnostic telemetry calculated from test performance.
                </Text>
              )}
            </View>

            {/* 2. Overall Teacher Remarks & Observations */}
            <Text style={styles.sectionTitle}>Teacher Remarks & Academic Observations</Text>
            <View style={styles.remarksCard}>
              <View style={styles.remarksHeaderRow}>
                <MessageSquare size={16} color="#4F46E5" />
                <Text style={styles.remarksHeaderTitle}>Faculty Assessment Feedback</Text>
              </View>
              <TextInput
                style={styles.remarksTextInput}
                placeholder="Write professional observations and specific improvement goals for the student..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={overallRemark}
                onChangeText={(text) => {
                  setOverallRemark(text);
                  setHasUnsavedChanges(true);
                }}
              />
            </View>

            {/* 3. Topic-Specific Teacher Remarks */}
            {weakTopicsData.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.sectionTitle}>Topic-Specific Remedial Notes</Text>
                {weakTopicsData.map((wt, idx) => (
                  <View key={idx} style={styles.topicRemarkCard}>
                    <View style={styles.topicRemarkHeader}>
                      <Text style={styles.topicRemarkTitle}>• {wt.topic}</Text>
                      <Text style={styles.topicRemarkAcc}>{wt.accuracy}% Accuracy</Text>
                    </View>
                    <TextInput
                      style={styles.topicRemarkInput}
                      placeholder={`Add specific advice for ${wt.topic} (e.g. Solve 5 practice problems)...`}
                      placeholderTextColor="#94A3B8"
                      value={topicRemarks[wt.topic] || ""}
                      onChangeText={(t) => {
                        setTopicRemarks((prev) => ({ ...prev, [wt.topic]: t }));
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Save Status Banner */}
            {saveMessage && (
              <View
                style={[
                  styles.saveBanner,
                  saveMessage.type === "success" ? styles.saveSuccessBanner : styles.saveErrorBanner,
                ]}
              >
                {saveMessage.type === "success" ? (
                  <Check size={16} color="#059669" />
                ) : (
                  <AlertTriangle size={16} color="#DC2626" />
                )}
                <Text
                  style={[
                    styles.saveBannerText,
                    saveMessage.type === "success" ? styles.saveSuccessText : styles.saveErrorText,
                  ]}
                >
                  {saveMessage.text}
                </Text>
              </View>
            )}

            {/* Save Changes Action Bar */}
            <View style={styles.saveActionContainer}>
              <TouchableOpacity
                style={[styles.saveReviewBtn, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveTeacherReview}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Save size={18} color="#FFFFFF" />
                )}
                <Text style={styles.saveReviewBtnText}>
                  {isSaving ? "Saving to Firebase..." : "Save Review & Remarks"}
                </Text>
              </TouchableOpacity>
              {lastSavedTime && (
                <Text style={styles.lastSavedSub}>Last saved: {lastSavedTime}</Text>
              )}
            </View>

            {/* Complete Itemized Question Analysis */}
            <Text style={styles.sectionTitle}>Question-by-Question Analysis</Text>
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
                  const qKey = qItem.questionId || String(qIdx);

                  return (
                    <View
                      key={qKey}
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
                              ? `✓ Correct (+${awarded} / ${qWeight})`
                              : isAnsEmpty
                              ? `― Unanswered (0 / ${qWeight})`
                              : `✕ Wrong (0 / ${qWeight})`}
                          </Text>
                        </View>
                      </View>

                      {/* Question Prompt */}
                      <Text style={styles.fieldLabel}>Question:</Text>
                      <Text style={styles.questionPromptText}>{qItem.questionText}</Text>

                      {/* Topic */}
                      {qItem.topic ? (
                        <Text style={styles.qTopicText}>Topic: {qItem.topic}</Text>
                      ) : null}

                      {/* Student Answer */}
                      <Text style={styles.fieldLabel}>Student Answer:</Text>
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

                      {/* Optional Question-Specific Teacher Remark */}
                      {!isCorrect && (
                        <View style={styles.qRemarkBox}>
                          <Text style={styles.qRemarkLabel}>FACULTY NOTE FOR Q{qIdx + 1}:</Text>
                          <TextInput
                            style={styles.qRemarkInput}
                            placeholder="Add specific question feedback..."
                            placeholderTextColor="#94A3B8"
                            value={questionRemarks[qKey] || ""}
                            onChangeText={(t) => {
                              setQuestionRemarks((prev) => ({ ...prev, [qKey]: t }));
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </View>
                      )}

                      {/* Card Footer Metrics */}
                      <View style={styles.qFooterRow}>
                        <Text style={styles.qFooterText}>
                          Time: {qItem.timeSpentSeconds || 0} sec
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
                Question-level telemetry unavailable.
              </Text>
            )}
          </View>
        )}

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
  presentationToggleRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  presentationTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  presentationTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  presentationTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  presentationTabTextActive: {
    fontWeight: "800",
    color: "#4F46E5",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ==========================================
  // STUDENT REPORT CARD STYLES
  // ==========================================
  studentReportCardContainer: {
    gap: 16,
  },
  reportCardHero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSubjectTag: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardExamTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  cardMetaSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 16,
  },
  heroScoreBox: {
    alignItems: "center",
    marginBottom: 14,
  },
  heroScoreText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0F172A",
  },
  heroTotalText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#94A3B8",
  },
  heroPercentageText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4F46E5",
    marginTop: 2,
  },
  performancePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  performancePillText: {
    fontWeight: "800",
    fontSize: 13,
  },
  pillGood: {
    backgroundColor: "#ECFDF5",
  },
  pillGoodText: {
    color: "#059669",
  },
  pillAverage: {
    backgroundColor: "#FEF3C7",
  },
  pillAverageText: {
    color: "#D97706",
  },
  pillNeedsWork: {
    backgroundColor: "#FEF2F2",
  },
  pillNeedsWorkText: {
    color: "#DC2626",
  },

  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  summaryTable: {
    gap: 10,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelWithDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tableLabel: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  tableValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  tableDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  timeSummaryGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  timeSummaryBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeSummaryVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 6,
    marginBottom: 2,
  },
  timeSummaryLbl: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  mostTimeSpentCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  mostTimeSpentLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
    textTransform: "uppercase",
  },
  mostTimeSpentValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E1B4B",
    marginTop: 2,
  },

  weakTopicsList: {
    gap: 8,
  },
  weakTopicItem: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  weakTopicHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weakTopicName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    flex: 1,
  },
  weakTopicAccBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D97706",
  },
  masteryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ECFDF5",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  masteryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
    flex: 1,
  },

  resourceTopicGroup: {
    marginBottom: 14,
  },
  resourceTopicTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  resourcesStack: {
    gap: 8,
  },
  cleanResourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  cleanResourceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cleanResourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  cleanResourceType: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6366F1",
    marginTop: 2,
  },
  cleanNoResourceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cleanNoResourceText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    flex: 1,
  },
  allSetText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 8,
  },

  // ==========================================
  // FACULTY DETAILED REPORT STYLES
  // ==========================================
  facultyReportContainer: {
    gap: 16,
  },
  studentInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  studentInfoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  studentAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4F46E5",
  },
  studentInfoName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  studentInfoSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  attemptPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attemptPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  studentMetaRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    justifyContent: "space-between",
  },
  studentMetaItem: {
    flex: 1,
  },
  studentMetaLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  studentMetaVal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitleWithoutMargin: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  editToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  statLbl: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },

  countsRow: {
    flexDirection: "row",
    gap: 8,
  },
  countBadge: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  countNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  countLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },

  aiDiagnosticCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  aiDiagnosticTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  editedBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: "auto",
  },
  editedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4F46E5",
  },
  editableAiContainer: {
    gap: 12,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },

  aiTagSection: {
    marginTop: 4,
  },
  aiTagLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  aiPointersList: {
    gap: 8,
    marginTop: 2,
  },
  aiPointerItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  aiPointerText: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "600",
    flex: 1,
    lineHeight: 19,
  },
  aiTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  strongTag: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  strongTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  weakTag: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  weakTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#991B1B",
  },
  aiRecommendationBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 4,
  },
  aiRecommendationText: {
    fontSize: 12,
    color: "#92400E",
    flex: 1,
    lineHeight: 18,
  },

  remarksCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  remarksHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  remarksHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  remarksTextInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    minHeight: 85,
    textAlignVertical: "top",
    lineHeight: 18,
  },

  topicRemarkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  topicRemarkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  topicRemarkTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  topicRemarkAcc: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D97706",
  },
  topicRemarkInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#0F172A",
  },

  saveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  saveSuccessBanner: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  saveErrorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  saveBannerText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  saveSuccessText: {
    color: "#065F46",
  },
  saveErrorText: {
    color: "#991B1B",
  },

  saveActionContainer: {
    alignItems: "center",
    marginVertical: 12,
    gap: 6,
  },
  saveReviewBtn: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveReviewBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  lastSavedSub: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },

  questionStack: {
    gap: 12,
  },
  qCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qCardCorrect: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  qCardIncorrect: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  qCardUnattempted: {
    borderLeftWidth: 4,
    borderLeftColor: "#94A3B8",
  },
  qCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
    backgroundColor: "#F1F5F9",
  },
  qResultText: {
    fontSize: 11,
    fontWeight: "800",
  },
  pillTextCorrect: {
    color: "#059669",
  },
  pillTextIncorrect: {
    color: "#DC2626",
  },
  pillTextUnattempted: {
    color: "#64748B",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 6,
    textTransform: "uppercase",
  },
  questionPromptText: {
    fontSize: 13,
    color: "#1E293B",
    lineHeight: 18,
    marginTop: 2,
    fontWeight: "500",
  },
  qTopicText: {
    fontSize: 11,
    color: "#6366F1",
    fontWeight: "700",
    marginTop: 4,
  },
  answerValueText: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
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
  qRemarkBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  qRemarkLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 4,
  },
  qRemarkInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: "#0F172A",
  },
  qFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    marginTop: 10,
  },
  qFooterText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  homeBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  homeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
