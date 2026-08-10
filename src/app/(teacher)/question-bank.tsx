import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { useAuthStore } from "../../stores/auth-store";
import { getQuestionBank, addQuestionToBank } from "../../services/firestore";
import { suggestQuestionItems } from "../../services/ai";
import type { Question, QuestionLevel } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { HelpCircle, Plus, Filter, CheckCircle2, Bookmark, X } from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";

export default function TeacherQuestionBankScreen() {
  const user = useAuthStore((state) => state.user);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<QuestionLevel | "all">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Manual Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [qText, setQText] = useState("");
  const [qLevel, setQLevel] = useState<QuestionLevel>("level1");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [saving, setSaving] = useState(false);

  // AI Modal State
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestionBank(selectedLevel === "all" ? undefined : selectedLevel);
      setQuestions(data);
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedLevel]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  const handleSaveQuestion = async () => {
    if (!qText.trim() || !optA.trim() || !optB.trim()) {
      Alert.alert("Missing Fields", "Please enter the question text and options.");
      return;
    }

    setSaving(true);
    try {
      const newQ = await addQuestionToBank(
        {
          text: qText.trim(),
          options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()].filter(Boolean),
          correctAnswer: optA.trim(),
          level: qLevel,
          subject: user?.subject || "Science",
          marks: qLevel === "level1" ? 1 : qLevel === "level2" ? 2 : 4,
          isTeacherAuthority: true,
        },
        user
      );

      if (newQ) {
        setQuestions((prev) => [newQ, ...prev]);
        setModalVisible(false);
        setQText("");
        setOptA("");
        setOptB("");
        setOptC("");
        setOptD("");
        Alert.alert("Saved", "New question added to institutional question bank.");
      }
    } catch (err) {
      console.error("Error saving question:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!aiTopic.trim()) {
      Alert.alert("Topic Required", "Please enter a subject topic for AI question generation.");
      return;
    }

    setGenerating(true);
    try {
      const items = await suggestQuestionItems(user?.subject || "Science", user?.grade || "10", aiTopic.trim(), 3);
      for (const item of items) {
        const saved = await addQuestionToBank(
          {
            ...item,
            correctAnswer: String(item.correctAnswer),
            isTeacherAuthority: true,
          },
          user
        );
        if (saved) setQuestions((prev) => [saved, ...prev]);
      }
      setAiModalVisible(false);
      setAiTopic("");
      Alert.alert("AI Items Generated", "3 diagnostic questions generated and saved to your bank.");
    } catch (err) {
      console.error("AI question generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Institutional Question Bank"
        subtitle="Manage Level 1, 2, 3 questions & AI item generator"
        fallbackRoute="/(teacher)"
      />

      <View style={styles.filterBar}>
        <View style={styles.levelRow}>
          {(["all", "level1", "level2", "level3"] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.levelChip, selectedLevel === l && styles.levelChipActive]}
              onPress={() => setSelectedLevel(l)}
            >
              <Text style={[styles.levelChipText, selectedLevel === l && styles.levelChipTextActive]}>
                {l === "all" ? "ALL" : l.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus color="#FFFFFF" size={18} />
          <Text style={styles.addBtnText}>Add Question</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.aiBtn} onPress={() => setAiModalVisible(true)}>
          <Bookmark color="#D97706" size={18} />
          <Text style={styles.aiBtnText}>AI Copilot Assist</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ZEEPREP_THEME.colors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
        ) : questions.length > 0 ? (
          questions.map((q, idx) => (
            <View key={q.id || idx} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{q.level?.toUpperCase() || "LEVEL 1"}</Text>
                </View>
                <Text style={styles.marksText}>+{q.marks || 1} Marks</Text>
              </View>

              <Text style={styles.questionText}>{q.text}</Text>

              {q.options && q.options.length > 0 ? (
                <View style={styles.optionsBox}>
                  {q.options.map((opt, oIdx) => (
                    <Text key={oIdx} style={styles.optionText}>
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <HelpCircle size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Questions Found</Text>
            <Text style={styles.emptySubtitle}>
              No items match the selected level. Add new questions to populate your bank.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Question Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Question to Bank</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Question Text</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter detailed question text..."
                placeholderTextColor="#94A3B8"
                multiline
                value={qText}
                onChangeText={setQText}
              />

              <Text style={styles.inputLabel}>Option A</Text>
              <TextInput style={styles.input} value={optA} onChangeText={setOptA} placeholder="Option A" placeholderTextColor="#94A3B8" />

              <Text style={styles.inputLabel}>Option B</Text>
              <TextInput style={styles.input} value={optB} onChangeText={setOptB} placeholder="Option B" placeholderTextColor="#94A3B8" />

              <TouchableOpacity style={styles.submitModalBtn} onPress={handleSaveQuestion} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitModalText}>Save Question to Bank</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Copilot Assist Modal */}
      <Modal visible={aiModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Bookmark color="#D97706" size={20} />
                <Text style={styles.modalTitle}>AI Teacher Copilot</Text>
              </View>
              <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Topic / Concept Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Thermodynamics / Electric Circuits"
              placeholderTextColor="#94A3B8"
              value={aiTopic}
              onChangeText={setAiTopic}
            />

            <TouchableOpacity style={styles.submitModalBtn} onPress={handleAiSuggest} disabled={generating}>
              {generating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitModalText}>Generate 3 Diagnostic Items</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  levelChipActive: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
  },
  levelChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  levelChipTextActive: {
    color: "#FFFFFF",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    height: 42,
    borderRadius: 12,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  aiBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    height: 42,
    borderRadius: 12,
  },
  aiBtnText: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  marksText: {
    fontSize: 12,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 10,
  },
  optionsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  optionText: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  emptyBox: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 80,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  submitModalBtn: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 12,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  submitModalText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
