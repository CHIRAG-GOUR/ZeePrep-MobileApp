import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getStudyResources } from "../../services/firestore";
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
  ExternalLink,
  RefreshCw,
  Eye,
  FileCode,
} from "lucide-react-native";
import {
  resolveResource,
  canUserAccessResource,
  ResolvedResource,
} from "../../utils/resource-resolver";
import { Video, ResizeMode, Audio, AVPlaybackStatus } from "expo-av";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

  // Text file content state
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  // Image loading state
  const [imageError, setImageError] = useState(false);

  // Audio Player State using expo-av Audio.Sound
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const loadResource = async () => {
    setLoading(true);
    setPermissionDenied(null);
    setErrorMsg(null);
    setTextContent(null);
    setImageError(false);

    try {
      let resolved: ResolvedResource | null = null;

      if (rawUrl) {
        resolved = resolveResource({
          id,
          title: paramTitle || "Study Material",
          type: (paramType as any) || "pdf",
          subject: paramSubject || "General",
          url: rawUrl,
        });
      } else {
        const allResources = await getStudyResources(user);
        const foundRaw = allResources.find((r) => r.id === id);

        if (!foundRaw) {
          setErrorMsg("This resource document could not be found in Firebase.");
          setLoading(false);
          return;
        }
        resolved = resolveResource(foundRaw);
      }

      const perm = canUserAccessResource(resolved, user);
      if (!perm.allowed) {
        setPermissionDenied(perm.reason || "Access restricted.");
        setLoading(false);
        return;
      }

      if (!resolved.isValidUrl) {
        setErrorMsg(resolved.errorMessage || "Invalid resource URL format.");
        setLoading(false);
        return;
      }

      setResource(resolved);

      // If text file, fetch content directly
      if (resolved.format === "text") {
        fetchTextFile(resolved.url);
      }
    } catch (err) {
      console.error("Error loading resource:", err);
      setErrorMsg("Unable to load this resource due to a network or permission issue.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTextFile = async (url: string) => {
    setTextLoading(true);
    try {
      const response = await fetch(url);
      if (response.ok) {
        const txt = await response.text();
        setTextContent(txt);
      } else {
        setTextContent(`[Unable to display text content. HTTP ${response.status}]`);
      }
    } catch (err) {
      console.error("Error fetching text file:", err);
      setTextContent("[Error loading text content from Firebase Storage.]");
    } finally {
      setTextLoading(false);
    }
  };

  useEffect(() => {
    loadResource();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [id, user]);

  // Audio Playback Controls
  const toggleAudioPlayback = async () => {
    if (!resource || resource.format !== "audio") return;

    try {
      if (sound) {
        if (isPlayingAudio) {
          await sound.pauseAsync();
          setIsPlayingAudio(false);
        } else {
          await sound.playAsync();
          setIsPlayingAudio(true);
        }
      } else {
        setIsAudioLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: resource.url },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setAudioPosition(status.positionMillis || 0);
              setAudioDuration(status.durationMillis || 0);
              setIsPlayingAudio(status.isPlaying);
            }
          }
        );
        setSound(newSound);
        setIsPlayingAudio(true);
        setIsAudioLoading(false);
      }
    } catch (err) {
      console.error("Audio playback error:", err);
      setIsAudioLoading(false);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const renderContent = () => {
    if (!resource) return null;

    // 1. TEXT FILES (.txt, .log, .md)
    if (resource.format === "text") {
      return (
        <View style={styles.textContainer}>
          <View style={styles.textHeaderBar}>
            <FileCode size={16} color={ZEEPREP_THEME.colors.primary} />
            <Text style={styles.textHeaderTitle}>Text Document Viewer</Text>
          </View>
          {textLoading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
              <Text style={styles.loaderText}>Fetching text file content...</Text>
            </View>
          ) : (
            <ScrollView style={styles.textScrollView} contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.textContent}>{textContent || "Empty file."}</Text>
            </ScrollView>
          )}
        </View>
      );
    }

    // 2. PDF DOCUMENTS
    if (resource.format === "pdf") {
      if (Platform.OS === "web") {
        return (
          <iframe
            src={resource.url}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#F8FAFC" }}
            allowFullScreen
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
              <Text style={styles.loaderText}>Loading PDF Document...</Text>
            </View>
          )}
        />
      );
    }

    // 3. IMAGES
    if (resource.format === "image") {
      if (imageError) {
        return (
          <View style={styles.errorCard}>
            <ImageIcon size={48} color="#94A3B8" />
            <Text style={styles.errorTitle}>Image Load Error</Text>
            <Text style={styles.errorSub}>The image could not be rendered from Firebase Storage.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setImageError(false)}>
              <Text style={styles.retryBtnText}>Retry Loading</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: resource.url }}
            style={styles.imageViewer}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        </View>
      );
    }

    // 4. VIDEO
    if (resource.format === "video") {
      if (resource.url.includes("youtube.com") || resource.url.includes("youtu.be")) {
        let videoId = "";
        if (resource.url.includes("youtu.be/")) {
          videoId = resource.url.split("youtu.be/")[1]?.split("?")[0] || "";
        } else if (resource.url.includes("v=")) {
          videoId = resource.url.split("v=")[1]?.split("&")[0] || "";
        }
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

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
        return <WebView source={{ uri: embedUrl }} style={{ flex: 1, backgroundColor: "#000" }} />;
      }

      return (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: resource.url }}
            style={styles.videoPlayer}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
          />
        </View>
      );
    }

    // 5. AUDIO
    if (resource.format === "audio") {
      return (
        <View style={styles.audioContainer}>
          <View style={styles.audioCard}>
            <View style={styles.audioIconCircle}>
              <Music size={44} color={ZEEPREP_THEME.colors.primary} />
            </View>

            <Text style={styles.audioTitle} numberOfLines={1}>
              {resource.title}
            </Text>
            <Text style={styles.audioSub}>{resource.subject} • Audio Lecture</Text>

            {/* Audio Progress Bar */}
            <View style={styles.progressRow}>
              <Text style={styles.timeText}>{formatTime(audioPosition)}</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: audioDuration > 0 ? `${(audioPosition / audioDuration) * 100}%` : "0%",
                    },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(audioDuration)}</Text>
            </View>

            {/* Play/Pause Button */}
            <TouchableOpacity
              style={styles.audioPlayBtn}
              onPress={toggleAudioPlayback}
              disabled={isAudioLoading}
            >
              {isAudioLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : isPlayingAudio ? (
                <Pause size={28} color="#FFFFFF" />
              ) : (
                <Play size={28} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 6. OFFICE DOCUMENTS (DOC, DOCX, PPT, PPTX, XLS, XLSX)
    if (resource.format === "doc") {
      const officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resource.url)}`;
      if (Platform.OS === "web") {
        return (
          <iframe
            src={officeEmbedUrl}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#F8FAFC" }}
            allowFullScreen
          />
        );
      }
      return (
        <WebView
          source={{ uri: officeEmbedUrl }}
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

    // 7. WEB LINK
    if (Platform.OS === "web") {
      return (
        <iframe src={resource.url} style={{ width: "100%", height: "100%", border: "none" }} />
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
            <Text style={styles.loaderText}>Loading Web Resource...</Text>
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

      {/* Main Content Body */}
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
            <TouchableOpacity style={styles.retryBtn} onPress={loadResource}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
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
  imageContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  imageViewer: {
    width: "100%",
    height: "100%",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  videoPlayer: {
    width: "100%",
    height: 280,
  },
  textContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  textHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  textHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  textScrollView: {
    flex: 1,
  },
  textContent: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
    color: "#E2E8F0",
    lineHeight: 20,
  },
  audioContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  audioCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  audioIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    marginBottom: 4,
  },
  audioSub: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
    marginBottom: 24,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    marginBottom: 24,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    width: 36,
    textAlign: "center",
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 3,
  },
  audioPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ZEEPREP_THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
