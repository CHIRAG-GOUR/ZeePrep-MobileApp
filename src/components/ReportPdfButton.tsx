/**
 * ZeePrep — Report PDF export trigger.
 * Web: prints the shared A4 HTML via a hidden iframe (browser "Save as PDF").
 * Native (APK): opens a WebView preview of the same HTML; the Save/Print button
 *   injects window.print(), which modern Android/iOS WebView routes to the
 *   system print sheet (Save as PDF). No extra native dependency required.
 * Both share ONE HTML document with A4 print CSS, so pagination is identical.
 */
import React, { useRef, useState } from "react";
import { Platform, Pressable, Text, StyleSheet, Modal, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { FileText, X } from "lucide-react-native";
import { buildReportHtml } from "../services/report-html";
import type { ReportHtmlInput } from "../services/report-html";
import { ZEEPREP_THEME as TH } from "../constants/theme";

type Props = ReportHtmlInput & { compact?: boolean };

function webPrint(htmlStr: string) {
  try {
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
    } as CSSStyleDeclaration);
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    const docu = win?.document;
    if (!docu) return;
    docu.open();
    docu.write(htmlStr);
    docu.close();
    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    };
    setTimeout(() => {
      try {
        win?.focus();
        win?.print();
      } catch (e) {
        console.warn("[ZeePrep] web print failed:", e);
      }
      setTimeout(cleanup, 1500);
    }, 350);
  } catch (e) {
    console.warn("[ZeePrep] web print failed:", e);
  }
}

export default function ReportPdfButton(props: Props) {
  const { compact, ...htmlInput } = props;
  const [open, setOpen] = useState(false);
  const webRef = useRef<WebView>(null);

  const getHtml = () => buildReportHtml(htmlInput);

  const onPress = () => {
    if (Platform.OS === "web") {
      webPrint(getHtml());
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Pressable onPress={onPress} style={[styles.btn, compact && styles.btnCompact]} accessibilityRole="button">
        <FileText size={compact ? 14 : 16} color="#FFFFFF" />
        {!compact && <Text style={styles.btnText}>Save as PDF</Text>}
      </Pressable>

      {Platform.OS !== "web" && (
        <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Preview</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => webRef.current?.injectJavaScript("window.print(); true;")}
                style={styles.printBtn}
              >
                <FileText size={15} color="#FFFFFF" />
                <Text style={styles.printBtnText}>Save / Print</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
                <X size={20} color={TH.colors.textPrimary} />
              </Pressable>
            </View>
          </View>
          <WebView
            ref={webRef}
            originWhitelist={["*"]}
            source={{ html: getHtml() }}
            style={{ flex: 1, backgroundColor: "#FFFFFF" }}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator style={{ marginTop: 40 }} color={TH.colors.primary} />
            )}
          />
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: TH.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: TH.borderRadius.full,
  },
  btnCompact: { paddingHorizontal: 10, paddingVertical: 8 },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
    borderBottomWidth: 1,
    borderBottomColor: TH.colors.border,
    backgroundColor: TH.colors.surface,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: TH.colors.textPrimary },
  modalActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: TH.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: TH.borderRadius.full,
  },
  printBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  closeBtn: { padding: 6 },
});
