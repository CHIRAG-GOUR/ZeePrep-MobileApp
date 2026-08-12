import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { X, FileText, Video, Music, Image as ImageIcon, FileCode, FileSpreadsheet, Link as LinkIcon } from "lucide-react-native";
import { ZEEPREP_THEME } from "../constants/theme";
import { autoDetectFileFormat, ResourceTypeFormat } from "../services/resource.service";

export interface ResourceItem {
  id?: string;
  title: string;
  url: string;
  type?: string;
  format?: string;
  displayType?: string;
  subject?: string;
}

interface ResourceViewerModalProps {
  visible: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
}

export function ResourceViewerModal({ visible, onClose, resource }: ResourceViewerModalProps) {
  if (!resource || !visible) return null;

  const url = resource.url || "";
  const detected = autoDetectFileFormat(url || resource.title || "", resource.type || resource.format || "");
  const format: ResourceTypeFormat = (resource.format as any) || detected.format;
  const displayType = resource.displayType || detected.displayType;

  // Google Engine default for Word (.docx/.doc), Excel (.xlsx/.xls), PPT (.pptx/.ppt)
  const isOfficeDoc = format === "word" || format === "excel" || url.match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/i);
  
  const getEmbedUrl = () => {
    if (isOfficeDoc || format === "pdf" || url.toLowerCase().endsWith(".pdf")) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl();
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  let youtubeId = "";
  if (isYouTube) {
    if (url.includes("youtu.be/")) {
      youtubeId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("v=")) {
      youtubeId = url.split("v=")[1]?.split("&")[0] || "";
    } else if (url.includes("embed/")) {
      youtubeId = url.split("embed/")[1]?.split("?")[0] || "";
    }
  }

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
          src="https://www.youtube-nocookie.com/embed/${youtubeId}?playsinline=1&autoplay=0&rel=0&modestbranding=1&fs=1&controls=1&enablejsapi=1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header Title Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              {format === "video" ? (
                <Video size={18} color={ZEEPREP_THEME.colors.primary} />
              ) : format === "audio" ? (
                <Music size={18} color="#D97706" />
              ) : format === "pdf" || format === "word" ? (
                <FileText size={18} color={ZEEPREP_THEME.colors.primary} />
              ) : format === "excel" ? (
                <FileSpreadsheet size={18} color="#059669" />
              ) : format === "image" ? (
                <ImageIcon size={18} color="#059669" />
              ) : format === "text" ? (
                <FileCode size={18} color={ZEEPREP_THEME.colors.primary} />
              ) : (
                <LinkIcon size={18} color="#4F46E5" />
              )}
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {resource.title}
              </Text>
              <Text style={styles.headerSub}>
                {resource.subject || "General"} • {displayType} (In-App Study Session)
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close viewer">
            <X size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Embedded Document / Video Viewer Container */}
        <View style={styles.contentBody}>
          {Platform.OS === "web" ? (
            <iframe
              src={embedUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                backgroundColor: isYouTube ? "#000000" : "#F8FAFC",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isYouTube ? (
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
              startInLoadingState
              renderLoading={() => (
                <View style={styles.centerLoader}>
                  <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
                  <Text style={styles.loaderText}>Loading YouTube video...</Text>
                </View>
              )}
            />
          ) : (
            <WebView
              source={{ uri: embedUrl }}
              style={styles.webView}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              setSupportMultipleWindows={false}
              injectedJavaScript={`
                (function() {
                  var style = document.createElement('style');
                  style.textContent = '#toolbar, .ndfHFb-c4YZDc-Wrber, .ndfHFb-c4YZDc-to915-LgbsSe, [role="toolbar"], .goog-toolbar { display: none !important; visibility: hidden !important; height: 0 !important; } .ndfHFb-c4YZDc-cYAaBd-V1ur5d { top: 0 !important; }';
                  document.head.appendChild(style);
                  var observer = new MutationObserver(function() {
                    var els = document.querySelectorAll('#toolbar, .ndfHFb-c4YZDc-Wrber, [role="toolbar"], .goog-toolbar');
                    els.forEach(function(el) { el.style.display = 'none'; });
                  });
                  observer.observe(document.body, { childList: true, subtree: true });
                })();
                true;
              `}
              renderLoading={() => (
                <View style={styles.centerLoader}>
                  <ActivityIndicator size="large" color={ZEEPREP_THEME.colors.primary} />
                  <Text style={styles.loaderText}>Rendering document in-app viewer...</Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginTop: Platform.OS === "ios" ? 44 : 0,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  contentBody: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  webView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
  },
});
