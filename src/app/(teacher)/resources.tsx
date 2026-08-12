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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useAuthStore } from "../../stores/auth-store";
import { addStudyResource } from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  FolderKanban,
  Plus,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Eye,
  FolderUp,
  FilePlus,
  FileSpreadsheet,
  FileCode,
  Trash2,
} from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";
import {
  getResourcesForUser,
  normalizeResource,
  autoDetectFileFormat,
  uploadResourceFileToStorage,
  NormalizedResource,
  ResourceTypeFormat,
} from "../../services/resource.service";

interface BatchFileItem {
  id: string;
  name: string;
  size: number;
  uri: string;
  mimeType: string;
  format: ResourceTypeFormat;
  displayType: string;
}

export default function TeacherResourcesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [resources, setResources] = useState<NormalizedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("all");

  // Upload Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadMode, setUploadMode] = useState<"single" | "batch">("single");

  // Single Upload Fields
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(user?.subject || "Science");
  const [grade, setGrade] = useState(user?.grade || "12");
  const [singleType, setSingleType] = useState<"pdf" | "video" | "link">("pdf");
  const [url, setUrl] = useState("");

  // Batch Upload Fields
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getResourcesForUser(user);
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

  const FORMAT_TABS = [
    { id: "all", label: "All Formats" },
    { id: "video", label: "Video Lectures" },
    { id: "pdf", label: "PDFs" },
    { id: "word", label: "Word Docs" },
    { id: "excel", label: "Excel Worksheets" },
    { id: "audio", label: "Audio Lectures" },
    { id: "image", label: "Images & Diagrams" },
    { id: "text", label: "Text & Notes" },
  ];

  const filteredResources = resources.filter((res) => {
    return selectedFormat === "all" || res.format === selectedFormat;
  });

  const handleResourcePress = (rawRes: any) => {
    const res = normalizeResource(rawRes);
    router.push({
      pathname: "/resource/[id]",
      params: {
        id: res.id || `res-${Date.now()}`,
        rawUrl: res.url,
        title: res.title,
        type: res.format || res.rawType,
        subject: res.subject,
      },
    } as any);
  };

  // Pick Multiple Files or Folder Directory
  const handlePickBatchFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newBatchItems: BatchFileItem[] = result.assets.map((asset) => {
          const detected = autoDetectFileFormat(asset.name, asset.mimeType || "");
          return {
            id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: asset.name,
            size: asset.size || 0,
            uri: asset.uri,
            mimeType: asset.mimeType || "application/octet-stream",
            format: detected.format,
            displayType: detected.displayType,
          };
        });

        setBatchFiles((prev) => [...prev, ...newBatchItems]);
      }
    } catch (err) {
      console.error("Error picking batch files:", err);
      Alert.alert("File Selection Error", "Unable to select files from device.");
    }
  };

  const handleRemoveBatchItem = (idToRemove: string) => {
    setBatchFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handlePublish = async () => {
    if (uploadMode === "single") {
      if (!title.trim() || !url.trim()) {
        Alert.alert("Required Fields", "Please provide a resource title and URL link.");
        return;
      }
      setUploading(true);
      try {
        let finalUrl = url.trim();
        let storagePath = "";

        // If user picked a local file or temporary device blob URL, upload to Firebase Storage
        if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
          const uploadRes = await uploadResourceFileToStorage(finalUrl, title.trim(), grade.trim(), subject.trim());
          if (uploadRes) {
            finalUrl = uploadRes.downloadUrl;
            storagePath = uploadRes.storagePath;
          }
        }

        const newRes = await addStudyResource(
          {
            title: title.trim(),
            subject: subject.trim(),
            grade: grade.trim(),
            section: "A",
            type: singleType,
            url: finalUrl,
            storagePath,
            uploadedBy: user?.uid || "",
          },
          user
        );

        if (newRes) {
          setResources((prev) => [normalizeResource(newRes), ...prev]);
          setModalVisible(false);
          setTitle("");
          setUrl("");
          Alert.alert("Success", "Study resource published successfully.");
        }
      } catch (err) {
        console.error("Error uploading single resource:", err);
      } finally {
        setUploading(false);
      }
    } else {
      // Batch Mode Publish: Upload each file to Firebase Storage
      if (batchFiles.length === 0) {
        Alert.alert("No Files Selected", "Please select one or more files to publish.");
        return;
      }

      setUploading(true);
      try {
        let publishedCount = 0;
        for (const item of batchFiles) {
          let itemUrl = item.uri;
          let itemStoragePath = "";

          if (!itemUrl.startsWith("http://") && !itemUrl.startsWith("https://")) {
            const uploadRes = await uploadResourceFileToStorage(itemUrl, item.name, grade.trim(), subject.trim());
            if (uploadRes) {
              itemUrl = uploadRes.downloadUrl;
              itemStoragePath = uploadRes.storagePath;
            }
          }

          const newRes = await addStudyResource(
            {
              title: item.name,
              subject: subject.trim(),
              grade: grade.trim(),
              section: "A",
              type: item.format,
              url: itemUrl,
              storagePath: itemStoragePath,
              uploadedBy: user?.uid || "",
            },
            user
          );

          if (newRes) {
            publishedCount++;
            setResources((prev) => [normalizeResource(newRes), ...prev]);
          }
        }

        setBatchFiles([]);
        setModalVisible(false);
        Alert.alert("Batch Success", `Successfully published ${publishedCount} study resources to Firebase Storage.`);
      } catch (err) {
        console.error("Error publishing batch resources:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Faculty Resources"
        subtitle="Manage & publish study materials for your classes"
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Plus color="#FFFFFF" size={16} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* 8 Format Filter Stream Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formatScroll}>
          {FORMAT_TABS.map((tab) => (
            <TouchableOpacity
              key={`t-fmt-${tab.id}`}
              style={[styles.formatChip, selectedFormat === tab.id && styles.formatChipActive]}
              onPress={() => setSelectedFormat(tab.id)}
            >
              <Text style={[styles.formatChipText, selectedFormat === tab.id && styles.formatChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        ) : filteredResources.length > 0 ? (
          filteredResources.map((rawRes, index) => {
            const res = normalizeResource(rawRes);
            const resFormat = (res.format || "").toString().toLowerCase();
            const uniqueKey = res.id ? `res-${res.id}` : `res-${index}-${res.title}`;
            const actionLabel =
              resFormat === "video" ? "Watch" : resFormat === "audio" ? "Listen" : "Open";

            return (
              <TouchableOpacity
                key={uniqueKey}
                style={styles.card}
                onPress={() => handleResourcePress(res)}
                activeOpacity={0.85}
              >
                <View style={styles.iconBox}>
                  {resFormat === "video" ? (
                    <Video color={ZEEPREP_THEME.colors.primary} size={20} />
                  ) : resFormat === "audio" ? (
                    <Music color="#D97706" size={20} />
                  ) : resFormat === "image" ? (
                    <ImageIcon color="#059669" size={20} />
                  ) : resFormat === "pdf" ? (
                    <FileText color={ZEEPREP_THEME.colors.primary} size={20} />
                  ) : resFormat === "excel" ? (
                    <FileSpreadsheet color="#059669" size={20} />
                  ) : resFormat === "word" ? (
                    <FileText color="#2563EB" size={20} />
                  ) : resFormat === "text" ? (
                    <FileCode color="#7C3AED" size={20} />
                  ) : (
                    <LinkIcon color="#4F46E5" size={20} />
                  )}
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.resTitle} numberOfLines={1}>
                    {res.title}
                  </Text>
                  <Text style={styles.resMeta}>
                    {res.subject} • Grade {res.grade} • {res.displayType}
                  </Text>
                </View>

                <View style={styles.openBtnBadge}>
                  <Eye size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.openBtnText}>{actionLabel}</Text>
                </View>
              </TouchableOpacity>
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

      {/* Multi-File & Folder Resource Upload Modal (Responsive Layout Rules) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header (Pinned top: shrink-0 pb-3 border-b) */}
            <View style={styles.modalHeaderPinned}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Publish Study Materials</Text>
                <Text style={styles.modalHeaderSubtitle}>Multi-file batch upload with auto-format detection</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>

            {/* Mode Switcher */}
            <View style={styles.modeSwitcherRow}>
              <TouchableOpacity
                style={[styles.modeTab, uploadMode === "single" && styles.modeTabActive]}
                onPress={() => setUploadMode("single")}
              >
                <FilePlus size={15} color={uploadMode === "single" ? "#FFFFFF" : "#64748B"} />
                <Text style={[styles.modeTabText, uploadMode === "single" && styles.modeTabTextActive]}>
                  Single File / Link
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, uploadMode === "batch" && styles.modeTabActive]}
                onPress={() => setUploadMode("batch")}
              >
                <FolderUp size={15} color={uploadMode === "batch" ? "#FFFFFF" : "#64748B"} />
                <Text style={[styles.modeTabText, uploadMode === "batch" && styles.modeTabTextActive]}>
                  Select Folder / Multiple
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Body Container (flex-1 overflow-y-auto scrollable) */}
            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.metaRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Subject</Text>
                  <TextInput
                    style={styles.input}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Subject"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Grade / Class</Text>
                  <TextInput
                    style={styles.input}
                    value={grade}
                    onChangeText={setGrade}
                    placeholder="Grade"
                  />
                </View>
              </View>

              {uploadMode === "single" ? (
                <View style={styles.singleFormGroup}>
                  <Text style={styles.inputLabel}>Resource Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Chapter 4 Practice Worksheet"
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
                </View>
              ) : (
                <View style={styles.batchFormGroup}>
                  <Text style={styles.inputLabel}>Multi-File & Directory Picker</Text>
                  <TouchableOpacity style={styles.pickBatchFilesBtn} onPress={handlePickBatchFiles}>
                    <FolderUp size={22} color={ZEEPREP_THEME.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickBatchTitle}>Select Folder or Multiple Files</Text>
                      <Text style={styles.pickBatchSub}>Auto-detects PDF, Word, Excel, Video, Audio & Images</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Preview List ("Files Identified") */}
                  {batchFiles.length > 0 ? (
                    <View style={styles.identifiedContainer}>
                      <View style={styles.identifiedHeaderRow}>
                        <Text style={styles.identifiedTitle}>
                          Files Identified ({batchFiles.length})
                        </Text>
                        <TouchableOpacity onPress={() => setBatchFiles([])}>
                          <Text style={styles.clearAllText}>Clear All</Text>
                        </TouchableOpacity>
                      </View>

                      {batchFiles.map((file) => (
                        <View key={file.id} style={styles.batchFileRow}>
                          <View style={styles.batchFileIconBox}>
                            {file.format === "video" ? (
                              <Video size={16} color={ZEEPREP_THEME.colors.primary} />
                            ) : file.format === "audio" ? (
                              <Music size={16} color="#D97706" />
                            ) : file.format === "pdf" ? (
                              <FileText size={16} color={ZEEPREP_THEME.colors.primary} />
                            ) : file.format === "word" ? (
                              <FileText size={16} color="#2563EB" />
                            ) : file.format === "excel" ? (
                              <FileSpreadsheet size={16} color="#059669" />
                            ) : file.format === "image" ? (
                              <ImageIcon size={16} color="#059669" />
                            ) : (
                              <FileCode size={16} color="#7C3AED" />
                            )}
                          </View>

                          <View style={styles.batchFileTextCol}>
                            <Text style={styles.batchFileName} numberOfLines={1}>
                              {file.name}
                            </Text>
                            <Text style={styles.batchFileMeta}>
                              {file.displayType} • {formatFileSize(file.size)}
                            </Text>
                          </View>

                          {/* Cross Button to Remove File Row */}
                          <TouchableOpacity
                            style={styles.removeFileBtn}
                            onPress={() => handleRemoveBatchItem(file.id)}
                            accessibilityLabel={`Remove ${file.name}`}
                          >
                            <X size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>

            {/* Modal Actions Footer (Pinned bottom: shrink-0 pt-3 border-t) */}
            <View style={styles.modalFooterPinned}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setModalVisible(false)}
                disabled={uploading}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handlePublish}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitModalText}>
                    {uploadMode === "batch" && batchFiles.length > 0
                      ? `Publish All (${batchFiles.length}) Files`
                      : "Publish Resource"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  tabContainer: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  formatScroll: {
    flexDirection: "row",
  },
  formatChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  formatChipActive: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderColor: ZEEPREP_THEME.colors.primary,
  },
  formatChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.primary,
  },
  formatChipTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
  openBtnBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  openBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },

  // Modal Container Styles (Responsive Rules)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 16,
  },
  modalContainer: {
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "column",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderPinned: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  modeSwitcherRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginTop: 14,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  modeTabTextActive: {
    color: "#FFFFFF",
  },
  modalBodyScroll: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
    marginBottom: 12,
  },
  singleFormGroup: {
    marginTop: 4,
  },
  batchFormGroup: {
    marginTop: 4,
  },
  pickBatchFilesBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  pickBatchTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  pickBatchSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  identifiedContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  identifiedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  identifiedTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  batchFileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  batchFileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  batchFileTextCol: {
    flex: 1,
    marginRight: 8,
  },
  batchFileName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  batchFileMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  removeFileBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  modalFooterPinned: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 10,
    marginTop: 10,
  },
  cancelModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  cancelModalText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  submitModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: ZEEPREP_THEME.colors.primary,
  },
  submitModalText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
