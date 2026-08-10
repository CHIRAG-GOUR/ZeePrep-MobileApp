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
import { getStudyResources, addStudyResource } from "../../services/firestore";
import type { StudyResource } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FolderKanban, Plus, FileText, Video, Link as LinkIcon, X } from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";
import { normalizeResourceType } from "../../utils/resource-normalizer";

export default function TeacherResourcesScreen() {
  const user = useAuthStore((state) => state.user);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upload Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(user?.subject || "Science");
  const [grade, setGrade] = useState(user?.grade || "12");
  const [type, setType] = useState<"pdf" | "video" | "link">("pdf");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getStudyResources(user);
      setResources(data);
    } catch (err) {
      console.error("Error loading teacher resources:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResources();
  };

  const handleUpload = async () => {
    if (!title.trim() || !url.trim()) {
      Alert.alert("Required Fields", "Please provide a resource title and URL link.");
      return;
    }
    setUploading(true);
    try {
      const newRes = await addStudyResource(
        {
          title: title.trim(),
          subject: subject.trim(),
          grade: grade.trim(),
          section: "A",
          type,
          url: url.trim(),
          uploadedBy: user?.uid || "",
        },
        user
      );

      if (newRes) {
        setResources((prev) => [newRes, ...prev]);
        setModalVisible(false);
        setTitle("");
        setUrl("");
        Alert.alert("Success", "Study resource published successfully.");
      }
    } catch (err) {
      console.error("Error uploading resource:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Faculty Resources"
        subtitle="Manage & publish study materials for your classes"
        fallbackRoute="/(teacher)"
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Plus color="#FFFFFF" size={16} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

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
        ) : resources.length > 0 ? (
          resources.map((rawRes) => {
            const res = normalizeResourceType(rawRes);
            return (
              <View key={res.id} style={styles.card}>
                <View style={styles.iconBox}>
                  {res.type === "video" ? (
                    <Video color={ZEEPREP_THEME.colors.primary} size={20} />
                  ) : res.type === "pdf" ? (
                    <FileText color={ZEEPREP_THEME.colors.primary} size={20} />
                  ) : (
                    <LinkIcon color={ZEEPREP_THEME.colors.primary} size={20} />
                  )}
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.resTitle}>{res.title}</Text>
                  <Text style={styles.resMeta}>
                    {res.subject} • Grade {res.grade} • {res.displayType}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <FolderKanban size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Resources Uploaded</Text>
            <Text style={styles.emptySubtitle}>Tap + Add to publish study materials for your students.</Text>
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Publish Study Resource</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chapter 4 Revision Notes PDF"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Resource URL / Drive Link</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#94A3B8"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalText}>Publish Resource</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
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
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  resTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  resMeta: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
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
