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
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getStudyResources } from "../../services/firestore";
import type { StudyResource } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { BookOpen, Search, ExternalLink, FileText, Video, Music, Image as ImageIcon, Link as LinkIcon, Eye } from "lucide-react-native";
import { normalizeResourceType } from "../../utils/resource-normalizer";

export default function StudentResourcesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [resources, setResources] = useState<StudyResource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeResource, setActiveResource] = useState<any | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getStudyResources(user);
      setResources(data);
    } catch (err) {
      console.error("Error fetching study resources:", err);
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

  const filteredResources = resources.filter((rawRes) => {
    const res = normalizeResourceType(rawRes);
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" || res.subject.toLowerCase() === selectedSubject.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  const subjectsList = Array.from(new Set(resources.map((r) => r.subject).filter(Boolean)));

  const handleResourcePress = (rawRes: any) => {
    const res = normalizeResourceType(rawRes);
    router.push({
      pathname: "/resource/[id]",
      params: {
        id: res.id || `res-${Date.now()}`,
        rawUrl: res.url,
        title: res.title,
        type: res.type,
        subject: res.subject,
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Material Library</Text>
        <Text style={styles.headerSubtitle}>
          Curated PDFs, video lectures, and notes uploaded by your faculty
        </Text>

        <View style={styles.searchWrapper}>
          <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources by title or subject..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {subjectsList.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
            <TouchableOpacity
              key="subject-all-chip"
              style={[styles.subjectChip, selectedSubject === "all" && styles.subjectChipActive]}
              onPress={() => setSelectedSubject("all")}
            >
              <Text style={[styles.subjectChipText, selectedSubject === "all" && styles.subjectChipTextActive]}>
                ALL SUBJECTS
              </Text>
            </TouchableOpacity>
            {subjectsList.map((sub, idx) => (
              <TouchableOpacity
                key={`subject-${sub}-${idx}`}
                style={[styles.subjectChip, selectedSubject === sub && styles.subjectChipActive]}
                onPress={() => setSelectedSubject(sub)}
              >
                <Text style={[styles.subjectChipText, selectedSubject === sub && styles.subjectChipTextActive]}>
                  {sub ? String(sub).toUpperCase() : "ALL"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
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
            const res = normalizeResourceType(rawRes);
            const resType = (res.type || "").toString().toLowerCase();
            const uniqueKey = res.id ? `res-${res.id}` : `res-${index}-${res.title}`;
            const actionLabel =
              resType === "video" ? "Watch" : resType === "audio" ? "Listen" : "Open";

            return (
              <TouchableOpacity
                key={uniqueKey}
                style={styles.card}
                onPress={() => handleResourcePress(res)}
                activeOpacity={0.85}
              >
                <View style={styles.cardIconBox}>
                  {resType === "video" ? (
                    <Video color={ZEEPREP_THEME.colors.primary} size={20} />
                  ) : resType === "audio" ? (
                    <Music color="#D97706" size={20} />
                  ) : resType === "image" ? (
                    <ImageIcon color="#059669" size={20} />
                  ) : resType === "pdf" ? (
                    <FileText color={ZEEPREP_THEME.colors.primary} size={20} />
                  ) : (
                    <LinkIcon color="#4F46E5" size={20} />
                  )}
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.resTitle} numberOfLines={1}>
                    {res.title}
                  </Text>
                  <Text style={styles.resMeta}>
                    {res.subject} • {res.displayType}
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
          <View style={styles.emptyCard}>
            <BookOpen size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Resources Found</Text>
            <Text style={styles.emptySub}>
              No study materials match your current search query or subject filter.
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 14,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
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
    marginBottom: 14,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  subjectScroll: {
    flexDirection: "row",
  },
  subjectChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    marginRight: 6,
  },
  subjectChipActive: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
  },
  subjectChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  subjectChipTextActive: {
    color: "#FFFFFF",
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
  cardIconBox: {
    width: 44,
    height: 44,
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
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
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
  emptySub: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
  },
});
