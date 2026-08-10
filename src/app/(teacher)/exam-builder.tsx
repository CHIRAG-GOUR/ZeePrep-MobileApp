import React, { useState } from "react";
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
import { createExam } from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileCheck, Sparkles, Plus, CheckCircle2 } from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";

export default function TeacherExamBuilderScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(user?.subject || "Physics");
  const [grade, setGrade] = useState(user?.grade || "12");
  const [section, setSection] = useState("A");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [totalMarks, setTotalMarks] = useState("100");
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please provide a valid title for the assessment.");
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
          totalMarks: parseInt(totalMarks, 10) || 100,
          questions: [],
          createdBy: user?.uid || "",
          createdByName: user?.name || "Faculty Member",
          status: "published",
        },
        user
      );

      if (created) {
        Alert.alert("Assessment Published", "Your new exam paper is now active for students.", [
          { text: "OK", onPress: () => router.push("/(teacher)") },
        ]);
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
            <Text style={styles.inputLabel}>Total Marks</Text>
            <TextInput
              style={styles.input}
              value={totalMarks}
              onChangeText={setTotalMarks}
              keyboardType="numeric"
            />
          </View>
        </View>

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
              <Text style={styles.publishBtnText}>Publish Assessment</Text>
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
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
});
