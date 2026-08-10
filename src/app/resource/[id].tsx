import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getStudyResources } from "../../services/firestore";
import type { StudyResource } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  ArrowLeft,
  FileText,
  Video as VideoIcon,
  Music,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import {
  resolveResource,
  canUserAccessResource,
  ResolvedResource,
} from "../../utils/resource-resolver";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ResourceViewerScreen() {
  const router = useRouter();
  const { id, rawUrl, title: paramTitle, type: paramType, subject: paramSubject } = useLocalSearchParams<{
    id: string;
    rawUrl?: string;
    title?: string;
    type?: string;
    subject?: string;
  }>();

  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState<ResolvedResource | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio / Video Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);

  const loadResource = async () => {
    setLoading(true);
    setPermissionDenied(null);
    setErrorMsg(null);

    try {
      // 1. If params were passed directly from navigation card
      if (rawUrl) {
        const resolved = resolveResource({
          id,
          title: paramTitle || "Study Material",
          type: (paramType as any) || "pdf",
          subject: paramSubject || "General",
          url: rawUrl,
        });

        const perm = canUserAccessResource(resolved, user);
        if (!perm.allowed) {
          setPermissionDenied(perm.reason || "Access restricted.");
          setLoading(false);
          return;
        }

        if (!resolved.isValidUrl) {
          setErrorMsg(resolved.errorMessage || "Invalid resource URL.");
          setLoading(false);
          return;
        }

        setResource(resolved);
        setLoading(false);
        return;
      }

      // 2. Fetch resource record from Firestore by ID
      const allResources = await getStudyResources(user);
      const foundRaw = allResources.find((r) => r.id === id);

      if (!foundRaw) {
        setErrorMsg("This resource could not be found in Firebase Storage.");
        setLoading(false);
        return;
      }

      const resolved = resolveResource(foundRaw);
      const perm = canUserAccessResource(resolved, user);

      if (!perm.allowed) {
        setPermissionDenied(perm.reason || "Your account does not have permission to view this resource.");
        setLoading(false);
        return;
      }

      if (!resolved.isValidUrl) {
        setErrorMsg(resolved.errorMessage || "Invalid Firebase Storage URL format.");
        setLoading(false);
        return;
      }

      setResource(resolved);
    } catch (err) {
      console.error("Error loading resource viewer:", err);
      setErrorMsg("Unable to load this resource due to a network or permission issue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResource();
  }, [id, user]);

  // Construct viewer embed URLs
  const getEmbedUrl = (res: ResolvedResource) => {
    const rawUrl = res.url;
    if (res.format === "video" && (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be"))) {
      let videoId = "";
      if (rawUrl.includes("youtu.be/")) {
        videoId = rawUrl.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (rawUrl.includes("v=")) {
        videoId = rawUrl.split("v=")[1]?.split("&")[0] || "";
      }
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
    }

    if (res.format === "pdf") {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
    }

    if (res.format === "doc") {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawUrl)}`;
    }

    return rawUrl;
  };

  const renderContent = () => {
    if (!resource) return null;

    const embedUrl = getEmbedUrl(resource);

    // 1. PDF Viewer
    if (resource.format === "pdf") {
      if (Platform.OS === "web") {
        return (
          <iframe
            src={embedUrl}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#F8FAFC" }}
            allowFullScreen
          />
        );
      }
      return (
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webView}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
              <Text style={styles.loaderText}>Loading PDF Document...</Text>
            </View>
          )}
        />
      );
    }

    // 2. Office Document Viewer (DOC, DOCX, PPT, PPTX, XLS, XLSX)
    if (resource.format === "doc") {
      if (Platform.OS === "web") {
        return (
          <iframe
            src={embedUrl}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#F8FAFC" }}
            allowFullScreen
          />
        );
      }
      return (
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webView}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
              <Text style={styles.loaderText}>Loading Office Document Preview...</Text>
            </View>
          )}
        />
      );
    }

    // 3. Image Viewer
    if (resource.format === "image") {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: resource.url }}
            style={styles.imageViewer}
            resizeMode="contain"
          />
        </View>
      );
    }

    // 4. Video Player (Native MP4/MOV or YouTube Embed)
    if (resource.format === "video") {
      if (resource.url.includes("youtube.com") || resource.url.includes("youtu.be")) {
        if (Platform.OS === "web") {
          return (
            <iframe
              src={embedUrl}
              style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#000" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          );
        }
        return (
          <WebView
            source={{ uri: embedUrl }}
            style={{ flex: 1, backgroundColor: "#000" }}
            allowsInlineMediaPlayback
          />
        );
      }

      return (
        <View style={styles.mediaContainer}>
          <Video
            source={{ uri: resource.url }}
            style={styles.videoPlayer}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
          />
        </View>
      );
    }

    // 5. Audio Player
    if (resource.format === "audio") {
      return (
        <View style={styles.audioContainer}>
          <View style={styles.audioCard}>
            <View style={styles.audioIconCircle}>
              <Music size={36} color={ZEEPREP_THEME.colors.primary} />
            </View>

            <Text style={styles.audioTitle}>{resource.title}</Text>
            <Text style={styles.audioSub}>{resource.subject} • Audio Lecture</Text>

            <View style={styles.audioMediaWrapper}>
              <Video
                source={{ uri: resource.url }}
                style={styles.hiddenAudio}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
              />
            </View>
          </View>
        </View>
      );
    }

    // 6. External Web Link
    if (Platform.OS === "web") {
      return (
        <iframe
          src={resource.url}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      );
    }
    return (
      <WebView
        source={{ uri: resource.url }}
        style={styles.webView}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
            <Text style={styles.loaderText}>Loading Resource Link...</Text>
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Back to Resources"
        >
          <ArrowLeft size={20} color={ZEEPREP_THEME.colors.textPrimary} />
          <Text style={styles.backBtnText}>Back to Resources</Text>
        </TouchableOpacity>

        {resource ? (
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {resource.title}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>{resource.displayType}</Text>
              </View>
              <Text style={styles.headerSub}>{resource.subject}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Main Content Area */}
      <View style={styles.body}>
        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
            <Text style={styles.loaderText}>Verifying Access & Loading Resource...</Text>
          </View>
        ) : permissionDenied ? (
          <View style={styles.errorCard}>
            <AlertTriangle size={48} color="#DC2626" />
            <Text style={styles.errorTitle}>Access Restricted</Text>
            <Text style={styles.errorSub}>{permissionDenied}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
              <Text style={styles.retryBtnText}>Back to Resources</Text>
            </TouchableOpacity>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorCard}>
            <AlertTriangle size={48} color="#D97706" />
            <Text style={styles.errorTitle}>Unable to Load Resource</Text>
            <Text style={styles.errorSub}>{errorMsg}</Text>
            <View style={styles.errorActionRow}>
              <TouchableOpacity style={styles.retryBtn} onPress={loadResource}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          renderContent()
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  headerBar: {
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerInfo: {
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  typeTag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  body: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  webView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 12,
  },
  errorCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: ZEEPREP_THEME.colors.surface,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorSub: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  errorActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  retryBtn: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  imageContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  mediaContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  videoPlayer: {
    width: "100%",
    height: 300,
  },
  audioContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  audioCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  audioIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  audioSub: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
    marginBottom: 20,
  },
  audioMediaWrapper: {
    width: "100%",
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
  },
  hiddenAudio: {
    width: "100%",
    height: 60,
  },
});
