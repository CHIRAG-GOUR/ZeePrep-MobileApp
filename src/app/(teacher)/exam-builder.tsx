import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { createExam, getQuestionBank } from "../../services/firestore";
import type { Question, MaxAttemptsOption } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileCheck, Sparkles, Plus, CheckCircle2, HelpCircle } from "lucide-react-native";
import { normalizeQuestion } from "../../utils/question-normalizer";

import { AppHeader } from "../../components/AppHeader";

export default function TeacherExamBuilderScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(user?.subject || "Physics");
  const [grade, setGrade] = useState(user?.grade || "10");
  const [section, setSection] = useState("A");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [maxAttempts, setMaxAttempts] = useState<MaxAttemptsOption>(1);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Fetch available questions from Question Bank
  useEffect(() => {
    async function loadBank() {
      setLoadingBank(true);
      try {
        const qList = await getQuestionBank();
        setAvailableQuestions(qList);
      } catch (err) {
        console.error("Error fetching question bank for exam builder:", err);
      } finally {
        setLoadingBank(false);
      }
    }
    loadBank();
  }, []);

  // Selected Questions List
  const selectedQuestions = availableQuestions.filter((q) => selectedQuestionIds.includes(q.id));

  // Requirement 6 & 10: Calculate Total Marks dynamically as sum(question.marks)
  const computedTotalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const toggleSelectQuestion = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please provide a valid title for the assessment.");
      return;
    }

    if (selectedQuestions.length === 0) {
      Alert.alert("No Questions Selected", "Please select at least 1 question from your Question Bank.");
      return;
    }

    setPublishing(true);
    try {
      const created = await createExam(
        {
          title: title.trim(),
          subject: subject.trim(),
          grade: grade.trim(),
          section: section.trim(),
          durationMinutes: parseInt(durationMinutes, 10) || 60,
          totalMarks: computedTotalMarks, // Dynamically computed sum(question.marks)
          maxAttempts: maxAttempts,
          questions: selectedQuestions,
          questionIds: selectedQuestionIds,
          createdBy: user?.uid || "",
          createdByName: user?.name || "Faculty Member",
          status: "published",
        },
        user
      );

      if (created) {
        Alert.alert(
          "Assessment Published",
          `Successfully created assessment with ${selectedQuestions.length} questions (Total Marks: ${computedTotalMarks}).`,
          [{ text: "OK", onPress: () => router.push("/(teacher)") }]
        );
      }
    } catch (err) {
      console.error("Error creating exam:", err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: ZEEPREP_THEME.colors.background }}>
      <AppHeader
        title="Assessment Constructor"
        subtitle={`Publish new exam paper for Grade ${grade} Sec ${section}`}
        fallbackRoute="/(teacher)"
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Assessment Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Term 1 Physics Diagnostic Exam"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.inputLabel}>Grade</Text>
              <TextInput
                style={styles.input}
                value={grade}
                onChangeText={setGrade}
                placeholder="Grade"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Duration (Minutes)</Text>
              <TextInput
                style={styles.input}
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.inputLabel}>Total Marks (Auto-Sum)</Text>
              <View style={styles.computedMarksCard}>
                <Text style={styles.computedMarksText}>{computedTotalMarks} Marks</Text>
              </View>
            </View>
          </View>

          {/* Maximum Attempts Allowed Selector (Requirement 31) */}
          <Text style={styles.inputLabel}>Maximum Attempts Allowed</Text>
          <Text style={styles.inputSublabel}>How many times can each student attempt this exam?</Text>
          <View style={styles.attemptsPillGrid}>
            {([1, 2, 3, 5, 10, "unlimited"] as MaxAttemptsOption[]).map((opt) => {
              const isSelected = maxAttempts === opt;
              return (
                <TouchableOpacity
                  key={String(opt)}
                  style={[styles.attemptPill, isSelected && styles.attemptPillSelected]}
                  onPress={() => setMaxAttempts(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.attemptPillText, isSelected && styles.attemptPillTextSelected]}>
                    {opt === "unlimited" ? "Unlimited" : `${opt} ${opt === 1 ? "Attempt" : "Attempts"}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Question Selector List */}
          <Text style={[styles.inputLabel, { marginTop: 20 }]}>
            Select Exam Questions ({selectedQuestions.length} Selected • {computedTotalMarks} Total Marks)
          </Text>

          {loadingBank ? (
            <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginVertical: 16 }} />
          ) : availableQuestions.length > 0 ? (
            <View style={{ gap: 10, marginVertical: 10 }}>
              {availableQuestions.map((rawQ, idx) => {
                const q = normalizeQuestion(rawQ);
                const isSelected = selectedQuestionIds.includes(q.id);

                return (
                  <TouchableOpacity
                    key={q.id || idx}
                    style={[
                      styles.qSelectCard,
                      isSelected && styles.qSelectCardSelected,
                    ]}
                    onPress={() => toggleSelectQuestion(q.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.qSelectHeader}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected ? <CheckCircle2 size={14} color="#FFFFFF" /> : null}
                      </View>
                      <Text style={styles.qSelectTitle}>Question {idx + 1}</Text>
                      <View style={styles.marksBadge}>
                        <Text style={styles.marksBadgeText}>+{q.marks || 1} Marks</Text>
                      </View>
                    </View>
                    <Text style={styles.qSelectText} numberOfLines={2}>
                      {q.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: "#64748B", marginVertical: 10 }}>
              No questions found in Question Bank. Add questions to Question Bank first.
            </Text>
          )}

          <TouchableOpacity
            style={styles.publishBtn}
            onPress={handlePublish}
            disabled={publishing}
            activeOpacity={0.85}
          >
            {publishing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 color="#FFFFFF" size={18} />
                <Text style={styles.publishBtnText}>
                  Publish Assessment ({selectedQuestions.length} Qs • {computedTotalMarks} Marks)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  computedMarksCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  computedMarksText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4F46E5",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  qSelectCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qSelectCardSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  qSelectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  qSelectTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  marksBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marksBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
  },
  qSelectText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 14,
    height: 48,
    marginTop: 24,
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  inputSublabel: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textMuted,
    marginBottom: 10,
  },
  attemptsPillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  attemptPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  attemptPillSelected: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderColor: ZEEPREP_THEME.colors.primary,
  },
  attemptPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  attemptPillTextSelected: {
    color: "#FFFFFF",
  },
});
