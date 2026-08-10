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
import * as WebBrowser from "expo-web-browser";
import { X, ExternalLink, FileText, Video, Link as LinkIcon, Shield } from "lucide-react-native";
import { ZEEPREP_THEME } from "../constants/theme";

export interface ResourceItem {
  id?: string;
  title: string;
  url: string;
  type?: string;
  displayType?: string;
  subject?: string;
}

interface ResourceViewerModalProps {
  visible: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
}

export function openInAppResource(resource: ResourceItem) {
  if (!resource || !resource.url) return;

  if (Platform.OS !== "web") {
    // Native In-App SafariViewController / Chrome Custom Tab (Keeps user strictly inside app)
    WebBrowser.openBrowserAsync(resource.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: ZEEPREP_THEME.colors.primary,
      controlsColor: "#FFFFFF",
      showTitle: true,
      enableBarCollapsing: false,
    }).catch(() => {});
  }
}

export function ResourceViewerModal({ visible, onClose, resource }: ResourceViewerModalProps) {
  if (!resource || !visible) return null;

  const type = (resource.type || "link").toLowerCase();
  const url = resource.url || "";

  // Helper to format YouTube embed URLs
  const getEmbedUrl = (rawUrl: string, resType: string) => {
    if (rawUrl.includes("youtube.com/watch") || rawUrl.includes("youtu.be")) {
      let videoId = "";
      if (rawUrl.includes("youtu.be/")) {
        videoId = rawUrl.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (rawUrl.includes("v=")) {
        videoId = rawUrl.split("v=")[1]?.split("&")[0] || "";
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
      }
    }

    if (resType === "pdf" || rawUrl.endsWith(".pdf")) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
    }

    return rawUrl;
  };

  const embedUrl = getEmbedUrl(url, type);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* In-App Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              {type === "video" ? (
                <Video size={18} color={ZEEPREP_THEME.colors.primary} />
              ) : type === "pdf" ? (
                <FileText size={18} color={ZEEPREP_THEME.colors.primary} />
              ) : (
                <LinkIcon size={18} color={ZEEPREP_THEME.colors.primary} />
              )}
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {resource.title}
              </Text>
              <Text style={styles.headerSub}>
                {resource.subject || "General"} • In-App Viewer
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {Platform.OS !== "web" ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openInAppResource(resource)}
                accessibilityLabel="Open in full browser"
              >
                <ExternalLink size={18} color="#64748B" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close viewer">
              <X size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Embedded In-App Web/Media Frame */}
        <View style={styles.contentBody}>
          {Platform.OS === "web" ? (
            <iframe
              src={embedUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                backgroundColor: "#F8FAFC",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <View style={styles.nativeFallback}>
              <ActivityIndicator color={ZEEPREP_THEME.colors.primary} size="large" />
              <Text style={styles.nativeFallbackText}>Opening resource in-app player...</Text>
              <TouchableOpacity
                style={styles.openNativeBtn}
                onPress={() => openInAppResource(resource)}
              >
                <Shield size={16} color="#FFFFFF" />
                <Text style={styles.openNativeBtnText}>Launch In-App Player</Text>
              </TouchableOpacity>
            </View>
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
    height: 64,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
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
  nativeFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  nativeFallbackText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 12,
    marginBottom: 20,
  },
  openNativeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  openNativeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
