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
  Modal,
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
  FileCode,
  Maximize2,
  Minimize2,
  MoreVertical,
  Settings,
  Check,
  X,
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
import { useEvent } from "expo";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function validateResourceForPlayback(url?: string | null): { valid: boolean; reason?: string } {
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return { valid: false, reason: "Media URL is missing or empty." };
  }
  const cleanUrl = url.trim();
  if (
    !cleanUrl.startsWith("http://") &&
    !cleanUrl.startsWith("https://") &&
    !cleanUrl.startsWith("file://") &&
    !cleanUrl.startsWith("content://")
  ) {
    return { valid: false, reason: "Unsupported media URL format." };
  }
  return { valid: true };
}

function formatMediaTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * SAFE NATIVE VIDEO PLAYER INNER COMPONENT
 */
function ZeePrepVideoPlayerInner({
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
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [selectedQuality, setSelectedQuality] = useState<string>("Auto");
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const player = useVideoPlayer(videoUrl, (p) => {
    try {
      if (p) {
        p.loop = false;
        p.play();
      }
    } catch (e) {
      console.warn("Video player init notice:", e);
    }
  });

  // Reactive native play/pause state from expo-video
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: Boolean(player?.playing) });

  // Update current time and duration
  useEffect(() => {
    const interval = setInterval(() => {
      if (player) {
        try {
          setCurrentTime(player.currentTime || 0);
          setDuration(player.duration || 0);
        } catch (e) {
          // Ignored
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  const togglePlay = () => {
    try {
      if (player?.playing) {
        player.pause();
      } else {
        player?.play();
      }
    } catch (e) {
      console.warn("Toggle play notice:", e);
    }
  };

  const seekRelative = (seconds: number) => {
    try {
      const dur = player?.duration || duration || 0;
      const cur = player?.currentTime || currentTime || 0;
      const nextTime = Math.max(0, Math.min(dur, cur + seconds));
      if (player) player.currentTime = nextTime;
      setCurrentTime(nextTime);
    } catch (e) {
      console.warn("Seek notice:", e);
    }
  };

  const handleSeekTouch = (evt: any) => {
    try {
      const touchX = evt.nativeEvent.locationX;
      const barWidth = SCREEN_WIDTH - 32;
      const totalDur = duration || player?.duration || 0;
      if (barWidth > 0 && totalDur > 0) {
        const targetTime = Math.max(0, Math.min(1, touchX / barWidth)) * totalDur;
        if (player) player.currentTime = targetTime;
        setCurrentTime(targetTime);
      }
    } catch (e) {
      console.warn("Touch seek notice:", e);
    }
  };

  const changeSpeed = (newSpeed: number) => {
    try {
      setSpeed(newSpeed);
      if (player) player.playbackRate = newSpeed;
      setShowMenu(false);
    } catch (e) {
      console.warn("Speed change notice:", e);
    }
  };

  const toggleMute = () => {
    try {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      if (player) player.muted = nextMute;
    } catch (e) {
      console.warn("Mute toggle notice:", e);
    }
  };

  const toggleFullscreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const isHlsStream = videoUrl.includes(".m3u8") || videoUrl.includes("manifest");
  const qualityOptions = isHlsStream
    ? ["Auto (Adaptive)", "1080p HD", "720p HD", "480p", "360p", "240p", "144p"]
    : ["Auto (Optimal Quality)", "Original Source (1080p HD)"];

  const renderPlayerContent = (inModal = false) => (
    <View style={inModal ? styles.fullScreenModalWrapper : styles.mobileVideoWrapper}>
      {/* Top Media Info Header */}
      {!inModal && (
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

          {/* 3-Dot Mobile Menu Button */}
          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() => setShowMenu(true)}
            accessibilityLabel="Video Options"
          >
            <MoreVertical size={20} color="#E2E8F0" />
          </TouchableOpacity>
        </View>
      )}

      {/* Video Surface - Native Controls STRICTLY Disabled (nativeControls={false}) */}
      <View style={inModal ? styles.fullScreenVideoContainer : styles.videoPlayerContainer}>
        <VideoView
          style={styles.nativeVideoViewFull}
          player={player}
          contentFit="contain"
          nativeControls={false}
          showsTimecodes={false}
        />
      </View>

      {/* Interactive Mobile Touch Seek Bar */}
      <View style={styles.seekBarContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleSeekTouch}
          style={styles.seekBarTrack}
        >
          <View style={[styles.seekBarFill, { width: `${progressPct}%` }]} />
          <View style={[styles.seekBarThumb, { left: `${progressPct}%` }]} />
        </TouchableOpacity>

        <View style={styles.timecodeRow}>
          <Text style={styles.timecodeText}>{formatMediaTime(currentTime)}</Text>
          <Text style={styles.timecodeText}>{formatMediaTime(duration)}</Text>
        </View>
      </View>

      {/* YouTube-Style ZeePrep Controls Bar */}
      <View style={styles.mobileControlsBar}>
        <View style={styles.transportRow}>
          {/* -10s Rewind */}
          <TouchableOpacity style={styles.circleIconBtn} onPress={() => seekRelative(-10)}>
            <RotateCcw size={18} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Main Reactive Play/Pause Button */}
          <TouchableOpacity style={styles.mainPlayBtn} onPress={togglePlay}>
            {isPlaying ? (
              <Pause size={24} color="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          {/* +10s Forward */}
          <TouchableOpacity style={styles.circleIconBtn} onPress={() => seekRelative(10)}>
            <RotateCw size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Mute, Settings & Fullscreen Buttons */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity style={styles.circleIconBtn} onPress={toggleMute}>
            {isMuted ? <VolumeX size={18} color="#EF4444" /> : <Volume2 size={18} color="#CBD5E1" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.circleIconBtn} onPress={() => setShowMenu(true)}>
            <Settings size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.circleIconBtn} onPress={toggleFullscreen}>
            {isFullScreen ? (
              <Minimize2 size={18} color="#CBD5E1" />
            ) : (
              <Maximize2 size={18} color="#CBD5E1" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Playback Settings Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Playback Settings</Text>

            {/* Speed Options */}
            <Text style={styles.speedLabel}>Playback Speed</Text>
            <View style={styles.speedRow}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <TouchableOpacity
                  key={`speed-${s}`}
                  style={[styles.speedChip, speed === s && styles.speedChipActive]}
                  onPress={() => changeSpeed(s)}
                >
                  <Text style={[styles.speedChipText, speed === s && styles.speedChipTextActive]}>
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quality Options */}
            <Text style={[styles.speedLabel, { marginTop: 16 }]}>Resolution / Quality</Text>
            <View style={{ gap: 4 }}>
              {qualityOptions.map((q) => (
                <TouchableOpacity
                  key={`qual-${q}`}
                  style={styles.speedOptionRow}
                  onPress={() => { setSelectedQuality(q); setShowMenu(false); }}
                >
                  <Text style={[styles.speedOptionText, selectedQuality === q && styles.speedOptionTextActive]}>
                    {q}
                  </Text>
                  {selectedQuality === q && <Check size={16} color="#3B82F6" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  if (isFullScreen) {
    return (
      <Modal visible={true} transparent={false} animationType="fade" onRequestClose={toggleFullscreen}>
        {renderPlayerContent(true)}
      </Modal>
    );
  }

  return renderPlayerContent(false);
}

function ZeePrepCustomVideoPlayer({
  videoUrl,
  title,
  subject,
}: {
  videoUrl: string;
  title: string;
  subject: string;
}) {
  const check = validateResourceForPlayback(videoUrl);
  if (!check.valid) {
    return (
      <View style={styles.errorCard}>
        <AlertTriangle size={36} color="#EF4444" />
        <Text style={styles.errorTitle}>Unable to Play Video</Text>
        <Text style={styles.errorSub}>{check.reason || "Invalid video URL format."}</Text>
      </View>
    );
  }
  return <ZeePrepVideoPlayerInner videoUrl={videoUrl} title={title} subject={subject} />;
}

/**
 * SAFE NATIVE AUDIO PLAYER INNER COMPONENT
 */
function ZeePrepAudioPlayerInner({
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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (player) {
        try {
          setIsPlaying(Boolean(player.playing));
        } catch (e) {
          // Ignored
        }
      }
    }, 300);
    return () => clearInterval(timer);
  }, [player]);

  // 32-Bar Waveform Visualizer (Animates ONLY when playing)
  const waveformHeights = Array.from({ length: 32 }, (_, i) => {
    const base = Math.sin(i * 0.45) * 40 + 50;
    if (isPlaying) {
      const pulse = Math.sin((i + animTick) * 0.6) * 20;
      return Math.max(15, Math.min(95, base + pulse));
    }
    return base;
  });

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setAnimTick((prev) => (prev + 1) % 100);
      }, 120);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    try {
      if (player?.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player?.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("Audio toggle play notice:", e);
    }
  };

  const seekRelative = (seconds: number) => {
    try {
      const dur = player?.duration || 0;
      const cur = player?.currentTime || 0;
      const nextTime = Math.max(0, Math.min(dur, cur + seconds));
      player?.seekTo(nextTime);
    } catch (e) {
      console.warn("Audio seek notice:", e);
    }
  };

  const changeSpeed = (newSpeed: number) => {
    try {
      setSpeed(newSpeed);
      player?.setPlaybackRate(newSpeed);
    } catch (e) {
      console.warn("Audio speed notice:", e);
    }
  };

  const toggleMute = () => {
    try {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      if (player) player.muted = nextMute;
    } catch (e) {
      console.warn("Audio mute notice:", e);
    }
  };

  const currentTime = player?.currentTime || 0;
  const duration = player?.duration || 0;
  const currentProgressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleWaveformPress = (barIndex: number) => {
    try {
      if (!duration) return;
      const seekPct = barIndex / 32;
      player?.seekTo(seekPct * duration);
    } catch (e) {
      console.warn("Audio waveform press notice:", e);
    }
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
            <Text style={styles.monoTimeText}>{formatMediaTime(currentTime)}</Text>
            <Text style={styles.monoTimeText}>{formatMediaTime(duration)}</Text>
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
              {isPlaying ? (
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

function ZeePrepCustomAudioPlayer({
  audioUrl,
  title,
  subject,
}: {
  audioUrl: string;
  title: string;
  subject: string;
}) {
  const check = validateResourceForPlayback(audioUrl);
  if (!check.valid) {
    return (
      <View style={styles.errorCard}>
        <AlertTriangle size={36} color="#EF4444" />
        <Text style={styles.errorTitle}>Unable to Play Audio</Text>
        <Text style={styles.errorSub}>{check.reason || "Invalid audio URL format."}</Text>
      </View>
    );
  }
  return <ZeePrepAudioPlayerInner audioUrl={audioUrl} title={title} subject={subject} />;
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
  const [modalFullScreen, setModalFullScreen] = useState(false);

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

    // 1. TEXT FILES (.txt, .log, .md) — In-app view only
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

    // 2. PDF DOCUMENTS — Rendered INSIDE App via Google Docs Engine (ZERO downloads)
    if (resource.format === "pdf" || resolvedUrl.toLowerCase().endsWith(".pdf")) {
      const pdfEmbedUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(resolvedUrl)}`;

      // JS to hide Google Docs toolbar (open-in-new-window / download buttons)
      const hideToolbarJS = `
        (function() {
          var style = document.createElement('style');
          style.textContent = '#toolbar, .ndfHFb-c4YZDc-Wrber, .ndfHFb-c4YZDc-to915-LgbsSe, [role="toolbar"], .goog-toolbar, .goog-toolbar-horizontal, div[style*="z-index: 2"] > div:first-child { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; } .ndfHFb-c4YZDc-cYAaBd-V1ur5d { top: 0 !important; }';
          document.head.appendChild(style);
          var observer = new MutationObserver(function() {
            var els = document.querySelectorAll('#toolbar, .ndfHFb-c4YZDc-Wrber, [role="toolbar"], .goog-toolbar');
            els.forEach(function(el) { el.style.display = 'none'; el.style.visibility = 'hidden'; });
          });
          observer.observe(document.body, { childList: true, subtree: true });
        })();
        true;
      `;

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
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScript={hideToolbarJS}
          onNavigationStateChange={(navState) => {
            // Block any navigation away from the viewer (prevents opening in browser)
            if (navState.url && !navState.url.includes('docs.google.com') && !navState.url.includes('drive.google.com') && !navState.url.startsWith('about:')) {
              return false;
            }
          }}
          setSupportMultipleWindows={false}
          renderLoading={() => (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
              <Text style={styles.loaderText}>Loading PDF Document In-App...</Text>
            </View>
          )}
        />
      );
    }

    // 3. IMAGES — In-app view only
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

    // 4. VIDEO & YOUTUBE — Mobile Redesign with Error 153 Fix
    if (resource.format === "video") {
      const isYouTube = resolvedUrl.includes("youtube.com") || resolvedUrl.includes("youtu.be");

      if (isYouTube) {
        let videoId = "";
        if (resolvedUrl.includes("youtu.be/")) {
          videoId = resolvedUrl.split("youtu.be/")[1]?.split("?")[0] || "";
        } else if (resolvedUrl.includes("v=")) {
          videoId = resolvedUrl.split("v=")[1]?.split("&")[0] || "";
        } else if (resolvedUrl.includes("embed/")) {
          videoId = resolvedUrl.split("embed/")[1]?.split("?")[0] || "";
        }

        // HTML5 YouTube IFrame wrapper — uses youtube-nocookie.com to avoid Error 152/153
        const youtubeHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body, html { width: 100%; height: 100%; background: #000; overflow: hidden; }
                iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
              </style>
            </head>
            <body>
              <iframe
                id="yt-player"
                src="https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&autoplay=0&rel=0&modestbranding=1&fs=1&controls=1&enablejsapi=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowfullscreen
              ></iframe>
              <script>
                function notifyFullscreenChange() {
                  var isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullscreen', isFullscreen: isFS }));
                  }
                }
                document.addEventListener('fullscreenchange', notifyFullscreenChange);
                document.addEventListener('webkitfullscreenchange', notifyFullscreenChange);
                document.addEventListener('mozfullscreenchange', notifyFullscreenChange);
                document.addEventListener('MSFullscreenChange', notifyFullscreenChange);
              </script>
            </body>
          </html>
        `;

        if (Platform.OS === "web") {
          return (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&playsinline=1`}
              style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#000" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          );
        }

        const renderYtContent = (inModal = false) => (
          <View style={{ flex: 1, backgroundColor: "#000000" }}>
            <View style={styles.youtubeTopBar}>
              <Text style={styles.youtubeTitleText} numberOfLines={1}>{resource.title}</Text>
              <TouchableOpacity style={styles.ytFullscreenBtn} onPress={() => setModalFullScreen(!modalFullScreen)}>
                <Maximize2 size={16} color="#FFFFFF" />
                <Text style={styles.ytFullscreenText}>{inModal || modalFullScreen ? "Exit Landscape" : "Fullscreen"}</Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: youtubeHtml, baseUrl: "https://www.youtube-nocookie.com" }}
              style={{ flex: 1, backgroundColor: "#000000" }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              setSupportMultipleWindows={false}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data && data.type === "fullscreen") {
                    setModalFullScreen(data.isFullscreen);
                  }
                } catch (e) {}
              }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.centerLoader}>
                  <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
                  <Text style={styles.loaderText}>Loading YouTube Video...</Text>
                </View>
              )}
            />
          </View>
        );

        if (modalFullScreen) {
          return (
            <Modal visible={true} transparent={false} animationType="fade" onRequestClose={() => setModalFullScreen(false)}>
              {renderYtContent(true)}
            </Modal>
          );
        }

        return renderYtContent(false);
      }

      return (
        <ZeePrepCustomVideoPlayer
          videoUrl={resolvedUrl}
          title={resource.title}
          subject={resource.subject}
        />
      );
    }

    // 5. AUDIO — ZeePrep Web App Custom Audio Player
    if (resource.format === "audio") {
      return (
        <ZeePrepCustomAudioPlayer
          audioUrl={resolvedUrl}
          title={resource.title}
          subject={resource.subject}
        />
      );
    }

    // 6. WORD & EXCEL DOCUMENTS (DOC, DOCX, XLS, XLSX, PPT, PPTX) — In-app Google Engine Viewer
    if (
      resource.format === "word" ||
      resource.format === "excel" ||
      resolvedUrl.match(/\.(doc|docx|ppt|pptx|xls|xlsx|csv)($|\?)/i)
    ) {
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resolvedUrl)}&embedded=true`;

      // JS to hide Google Docs toolbar (open-in-new-window / download buttons)
      const hideDocToolbarJS = `
        (function() {
          var style = document.createElement('style');
          style.textContent = '#toolbar, .ndfHFb-c4YZDc-Wrber, .ndfHFb-c4YZDc-to915-LgbsSe, [role="toolbar"], .goog-toolbar, .goog-toolbar-horizontal, div[style*="z-index: 2"] > div:first-child { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; } .ndfHFb-c4YZDc-cYAaBd-V1ur5d { top: 0 !important; }';
          document.head.appendChild(style);
          var observer = new MutationObserver(function() {
            var els = document.querySelectorAll('#toolbar, .ndfHFb-c4YZDc-Wrber, [role="toolbar"], .goog-toolbar');
            els.forEach(function(el) { el.style.display = 'none'; el.style.visibility = 'hidden'; });
          });
          observer.observe(document.body, { childList: true, subtree: true });
        })();
        true;
      `;

      if (Platform.OS === "web") {
        return (
          <iframe
            src={googleViewerUrl}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#F8FAFC" }}
            allowFullScreen={false}
          />
        );
      }
      return (
        <WebView
          source={{ uri: googleViewerUrl }}
          style={styles.webView}
          startInLoadingState
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScript={hideDocToolbarJS}
          setSupportMultipleWindows={false}
          renderLoading={() => (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
              <Text style={styles.loaderText}>Loading Document Viewer In-App...</Text>
            </View>
          )}
        />
      );
    }

    // 7. WEB LINK — In-app view only
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
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
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
  imageContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
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
  youtubeTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  speedLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  speedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  speedOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  youtubeTitleText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  ytFullscreenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ytFullscreenText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenModalWrapper: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "space-between",
  },
  fullScreenVideoContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  exitFullScreenFloatingBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  exitFullScreenText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  closeFullscreenBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  closeFullscreenText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  landscapeVideoWrapper: {
    width: "100%",
    height: "100%",
  },
  imageViewer: {
    width: "100%",
    height: "100%",
  },

  // ---------------- MOBILE VIDEO PLAYER STYLES (YOUTUBE REDESIGN) ----------------
  mobileVideoWrapper: {
    flex: 1,
    backgroundColor: "#090D16",
    justifyContent: "space-between",
  },
  videoPlayerContainer: {
    width: "100%",
    flex: 1,
    minHeight: 240,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  nativeVideoViewFull: {
    width: "100%",
    height: "100%",
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
  seekBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#0F172A",
  },
  seekBarTrack: {
    height: 12,
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 6,
    justifyContent: "center",
    position: "relative",
  },
  seekBarFill: {
    height: 4,
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  seekBarThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#6366F1",
    position: "absolute",
    top: -1,
    marginLeft: -7,
  },
  timecodeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timecodeText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  mobileControlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 10,
  },
  speedGrid: {
    gap: 8,
  },
  speedOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#1E293B",
  },
  speedOptionBtnActive: {
    backgroundColor: "#4F46E5",
  },
  speedOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#CBD5E1",
  },
  speedOptionTextActive: {
    color: "#FFFFFF",
  },
  qualityBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#1E293B",
  },
  qualityText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // ---------------- CUSTOM AUDIO PLAYER STYLES ----------------
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
