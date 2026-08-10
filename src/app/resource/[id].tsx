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
  RotateCw,
  Volume2,
  VolumeX,
  Headphones,
  Zap,
  FileCode,
} from "lucide-react-native";
import {
  normalizeResource,
  resolveResourceUrl,
  canUserAccessResource,
  getResourcesForUser,
  NormalizedResource,
} from "../../services/resource.service";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAudioPlayer } from "expo-audio";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * CUSTOM VIDEO PLAYER — Matched exactly to ZeePrep Web App CustomVideoPlayer design.
 * Features: Play/Pause, Rewind (-10s), Fast Forward (+10s), Speed Selector (0.75x - 2x), Mute Toggle, No Download option.
 */
function ZeePrepCustomVideoPlayer({
  videoUrl,
  title,
  subject,
}: {
  videoUrl: string;
  title: string;
  subject: string;
}) {
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.play();
  });

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekRelative = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(player.duration || 0, player.currentTime + seconds));
    player.currentTime = nextTime;
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    player.playbackRate = newSpeed;
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    player.muted = nextMute;
  };

  return (
    <View style={styles.webVideoWrapper}>
      {/* Top Media Header */}
      <View style={styles.webMediaHeader}>
        <View style={styles.webMediaBadgeBox}>
          <VideoIcon size={16} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.webMediaTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.webMediaSub}>{subject} • Interactive Video Lesson</Text>
        </View>
      </View>

      {/* Video Viewport Container */}
      <View style={styles.videoPlayerBox}>
        <VideoView style={styles.nativeVideoView} player={player} nativeControls={false} />
      </View>

      {/* ZeePrep Custom Controls Bar (No Download Option Anywhere) */}
      <View style={styles.webControlsBar}>
        {/* Playback Transport Buttons */}
        <View style={styles.transportRow}>
          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() => seekRelative(-10)}
            accessibilityLabel="-10 seconds"
          >
            <RotateCcw size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainPlayBtn}
            onPress={togglePlay}
            accessibilityLabel={player.playing ? "Pause" : "Play"}
          >
            {player.playing ? (
              <Pause size={24} color="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() => seekRelative(10)}
            accessibilityLabel="+10 seconds"
          >
            <RotateCw size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Speed Selector Chips */}
        <View style={styles.speedChipGroup}>
          {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
            <TouchableOpacity
              key={`speed-${spd}`}
              style={[styles.speedChip, speed === spd && styles.speedChipActive]}
              onPress={() => changeSpeed(spd)}
            >
              <Text style={[styles.speedChipText, speed === spd && styles.speedChipTextActive]}>
                {spd}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Volume / Mute Button */}
        <TouchableOpacity style={styles.circleIconBtn} onPress={toggleMute}>
          {isMuted ? <VolumeX size={18} color="#EF4444" /> : <Volume2 size={18} color="#CBD5E1" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * CUSTOM AUDIO PLAYER — Matched exactly to ZeePrep Web App CustomAudioPlayer design.
 * Features: Animated 32-Bar Waveform Visualizer, Play/Pause, -10s/+10s, Speed selector, Volume toggle, No Download option.
 */
function ZeePrepCustomAudioPlayer({
  audioUrl,
  title,
  subject,
}: {
  audioUrl: string;
  title: string;
  subject: string;
}) {
  const player = useAudioPlayer(audioUrl);
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [animTick, setAnimTick] = useState<number>(0);

  // Animated Waveform Heights (32 bars matching web app)
  const waveformHeights = Array.from({ length: 32 }, (_, i) => {
    const base = Math.sin(i * 0.45) * 40 + 50; // 10% to 90%
    if (player.playing) {
      // Dynamic bouncing when playing
      const pulse = Math.sin((i + animTick) * 0.6) * 20;
      return Math.max(15, Math.min(95, base + pulse));
    }
    return base;
  });

  useEffect(() => {
    let timer: any = null;
    if (player.playing) {
      timer = setInterval(() => {
        setAnimTick((prev) => (prev + 1) % 100);
      }, 120);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [player.playing]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekRelative = (seconds: number) => {
    const duration = player.duration || 0;
    const currentTime = player.currentTime || 0;
    const nextTime = Math.max(0, Math.min(duration, currentTime + seconds));
    player.seekTo(nextTime);
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    player.setPlaybackRate(newSpeed);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    player.muted = nextMute;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentTime = player.currentTime || 0;
  const duration = player.duration || 0;
  const currentProgressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleWaveformPress = (barIndex: number) => {
    if (!duration) return;
    const seekPct = barIndex / 32;
    player.seekTo(seekPct * duration);
  };

  return (
    <View style={styles.webAudioContainer}>
      <View style={styles.webAudioCard}>
        {/* Header Info Bar */}
        <View style={styles.webAudioHeader}>
          <View style={styles.audioIconBadge}>
            <Headphones size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.audioTitleText} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.audioSubText}>{subject} • Interactive Audio Lesson & Podcast</Text>
          </View>
        </View>

        {/* 32-Bar Interactive Waveform Visualizer */}
        <View style={styles.waveformContainer}>
          <View style={styles.waveformBarsRow}>
            {waveformHeights.map((heightPct, idx) => {
              const barProgressPct = (idx / 32) * 100;
              const isPlayed = barProgressPct <= currentProgressPct;

              return (
                <TouchableOpacity
                  key={`wave-${idx}`}
                  style={[
                    styles.waveformBar,
                    { height: `${heightPct}%` },
                    isPlayed ? styles.waveformBarActive : styles.waveformBarInactive,
                  ]}
                  onPress={() => handleWaveformPress(idx)}
                  activeOpacity={0.8}
                />
              );
            })}
          </View>

          {/* Time Progress Display */}
          <View style={styles.timeDisplayRow}>
            <Text style={styles.monoTimeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.monoTimeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Main Playback Controls Toolbar */}
        <View style={styles.audioControlsRow}>
          {/* Transport Buttons */}
          <View style={styles.transportRow}>
            <TouchableOpacity style={styles.circleIconBtn} onPress={() => seekRelative(-10)}>
              <RotateCcw size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mainPlayBtn} onPress={togglePlay}>
              {player.playing ? (
                <Pause size={24} color="#FFFFFF" />
              ) : (
                <Play size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.circleIconBtn} onPress={() => seekRelative(10)}>
              <RotateCw size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Speed Selector Chips */}
          <View style={styles.speedChipGroup}>
            {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
              <TouchableOpacity
                key={`aud-speed-${spd}`}
                style={[styles.speedChip, speed === spd && styles.speedChipActive]}
                onPress={() => changeSpeed(spd)}
              >
                <Text style={[styles.speedChipText, speed === spd && styles.speedChipTextActive]}>
                  {spd}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mute Toggle */}
          <TouchableOpacity style={styles.circleIconBtn} onPress={toggleMute}>
            {isMuted ? <VolumeX size={18} color="#EF4444" /> : <Volume2 size={18} color="#CBD5E1" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
  const [resource, setResource] = useState<NormalizedResource | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string>("");
  const [permissionDenied, setPermissionDenied] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Text file state
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadResource = async () => {
    setLoading(true);
    setPermissionDenied(null);
    setErrorMsg(null);
    setTextContent(null);
    setImageError(false);

    try {
      let normalized: NormalizedResource | null = null;

      if (rawUrl) {
        normalized = normalizeResource({
          id,
          title: paramTitle || "Study Material",
          type: (paramType as any) || "pdf",
          subject: paramSubject || "General",
          url: rawUrl,
        });
      } else {
        const allResources = await getResourcesForUser(user);
        const found = allResources.find((r) => r.id === id);

        if (!found) {
          setErrorMsg("This resource document could not be found in Firebase.");
          setLoading(false);
          return;
        }
        normalized = found;
      }

      const perm = canUserAccessResource(normalized, user);
      if (!perm.allowed) {
        setPermissionDenied(perm.reason || "Access restricted.");
        setLoading(false);
        return;
      }

      if (!normalized.isValidUrl) {
        setErrorMsg(normalized.errorMessage || "Invalid resource URL format.");
        setLoading(false);
        return;
      }

      // Resolve canonical Firebase Storage download URL
      const finalUrl = await resolveResourceUrl(normalized);
      if (!finalUrl) {
        setErrorMsg("Unable to resolve canonical Firebase Storage URL.");
        setLoading(false);
        return;
      }

      setResource(normalized);
      setResolvedUrl(finalUrl);

      // If text file, fetch content directly
      if (normalized.format === "text") {
        fetchTextFile(finalUrl);
      }
    } catch (err) {
      console.error("Error loading resource viewer:", err);
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
        setTextContent(`[Unable to display text file content. HTTP Status: ${response.status}]`);
      }
    } catch (err) {
      console.error("Error fetching text file content:", err);
      setTextContent("[Error reading text content from Firebase Storage.]");
    } finally {
      setTextLoading(false);
    }
  };

  useEffect(() => {
    loadResource();
  }, [id, user]);

  const renderContent = () => {
    if (!resource || !resolvedUrl) return null;

    // 1. TEXT FILES (.txt, .log, .md) — In-app view only, NO download option
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
              <Text style={styles.loaderText}>Fetching text document content...</Text>
            </View>
          ) : (
            <ScrollView style={styles.textScrollView} contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.textContent}>{textContent || "Empty text file."}</Text>
            </ScrollView>
          )}
        </View>
      );
    }

    // 2. PDF DOCUMENTS — In-app view only with toolbar disabled (#toolbar=0&navpanes=0), NO download option
    if (resource.format === "pdf") {
      const pdfEmbedUrl = resolvedUrl.includes("#")
        ? resolvedUrl
        : `${resolvedUrl}#toolbar=0&navpanes=0&scrollbar=1`;

      if (Platform.OS === "web") {
        return (
          <iframe
            src={pdfEmbedUrl}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#F8FAFC" }}
            allowFullScreen={false}
          />
        );
      }
      return (
        <WebView
          source={{ uri: pdfEmbedUrl }}
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

    // 3. IMAGES — In-app view only, NO download option
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
            source={{ uri: resolvedUrl }}
            style={styles.imageViewer}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        </View>
      );
    }

    // 4. VIDEO — ZeePrep Web App Custom Video Player, NO download option
    if (resource.format === "video") {
      if (resolvedUrl.includes("youtube.com") || resolvedUrl.includes("youtu.be")) {
        let videoId = "";
        if (resolvedUrl.includes("youtu.be/")) {
          videoId = resolvedUrl.split("youtu.be/")[1]?.split("?")[0] || "";
        } else if (resolvedUrl.includes("v=")) {
          videoId = resolvedUrl.split("v=")[1]?.split("&")[0] || "";
        }
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`;

        if (Platform.OS === "web") {
          return (
            <iframe
              src={embedUrl}
              style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#000" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen={false}
            />
          );
        }
        return <WebView source={{ uri: embedUrl }} style={{ flex: 1, backgroundColor: "#000" }} />;
      }

      return (
        <ZeePrepCustomVideoPlayer
          videoUrl={resolvedUrl}
          title={resource.title}
          subject={resource.subject}
        />
      );
    }

    // 5. AUDIO — ZeePrep Web App Custom Audio Player, NO download option
    if (resource.format === "audio") {
      return (
        <ZeePrepCustomAudioPlayer
          audioUrl={resolvedUrl}
          title={resource.title}
          subject={resource.subject}
        />
      );
    }

    // 6. OFFICE DOCUMENTS (DOC, DOCX, PPT, PPTX, XLS, XLSX) — In-app view only, NO download option
    if (resource.format === "doc") {
      const officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedUrl)}`;
      if (Platform.OS === "web") {
        return (
          <iframe
            src={officeEmbedUrl}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#F8FAFC" }}
            allowFullScreen={false}
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

    // 7. WEB LINK — In-app view only, NO download option
    if (Platform.OS === "web") {
      return (
        <iframe src={resolvedUrl} style={{ width: "100%", height: "100%", border: "none" }} />
      );
    }
    return (
      <WebView
        source={{ uri: resolvedUrl }}
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
            <Text style={styles.loaderText}>Verifying Access & Resolving Resource...</Text>
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

  // ---------------- CUSTOM VIDEO PLAYER STYLES (ZEEPREP WEB MATCH) ----------------
  webVideoWrapper: {
    flex: 1,
    backgroundColor: "#090D16",
    justifyContent: "space-between",
  },
  webMediaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  webMediaBadgeBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  webMediaTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  webMediaSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 2,
  },
  videoPlayerBox: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  nativeVideoView: {
    width: "100%",
    height: 280,
  },
  webControlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#0F172A",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  transportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  circleIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  mainPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  speedChipGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1E293B",
    padding: 4,
    borderRadius: 12,
  },
  speedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speedChipActive: {
    backgroundColor: "#4F46E5",
  },
  speedChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  speedChipTextActive: {
    color: "#FFFFFF",
  },

  // ---------------- CUSTOM AUDIO PLAYER STYLES (ZEEPREP WEB MATCH) ----------------
  webAudioContainer: {
    flex: 1,
    backgroundColor: "#090D16",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  webAudioCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  webAudioHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    marginBottom: 16,
  },
  audioIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  audioTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  audioSubText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 2,
  },
  waveformContainer: {
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 20,
  },
  waveformBarsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 4,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  waveformBarActive: {
    backgroundColor: "#6366F1",
  },
  waveformBarInactive: {
    backgroundColor: "#1E293B",
  },
  timeDisplayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  monoTimeText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  audioControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  // Text File Styles
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
});
