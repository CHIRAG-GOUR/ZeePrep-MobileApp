import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Scale,
  Shield,
  UserCheck,
  Ban,
  Mail,
} from "lucide-react-native";

export default function TermsConditionsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isDesktopWeb && styles.desktopContainer,
      ]}
      showsVerticalScrollIndicator={true}
    >
      {/* 1. Header Navigation Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/login" as any))}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0F172A" />
          <Text style={styles.backBtnText}>Back to App</Text>
        </TouchableOpacity>
        <View style={styles.headerBadge}>
          <Scale size={16} color="#4F46E5" style={{ marginRight: 5 }} />
          <Text style={styles.headerBadgeText}>Terms of Service</Text>
        </View>
      </View>

      {/* 2. Hero Header */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconCircle}>
          <FileText size={36} color="#4F46E5" />
        </View>
        <Text style={styles.heroTitle}>Terms & Conditions</Text>
        <Text style={styles.heroSubtitle}>
          ZeePrep Smart Learning & CBT Examination Platform
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>App: <Text style={styles.metaBold}>ZeePrep (com.skillizee.zeeprep)</Text></Text>
          <Text style={styles.metaItem}>Developer: <Text style={styles.metaBold}>Skillizee</Text></Text>
          <Text style={styles.metaItem}>Last Updated: <Text style={styles.metaBold}>September 2026</Text></Text>
        </View>
      </View>

      {/* 3. Terms Content */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <CheckCircle size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        </View>
        <Text style={styles.paragraph}>
          By downloading, accessing, or using the <Text style={styles.boldText}>ZeePrep</Text> application or web portal (<Text style={styles.boldText}>https://zeeprep.skillizee.io</Text>), you agree to be legally bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use the application.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <UserCheck size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>2. User Accounts & Academic Roles</Text>
        </View>
        <Text style={styles.paragraph}>
          • <Text style={styles.boldText}>Eligibility & Registration: </Text>ZeePrep accounts (Student, Teacher, School Admin) are provisioned through participating educational institutions or authorized registration. Users must provide accurate and truthful identity details.{"\n"}
          • <Text style={styles.boldText}>Account Confidentiality: </Text>You are solely responsible for maintaining the confidentiality of your credentials (Login ID and password). You agree not to share your account with unauthorized individuals.{"\n"}
          • <Text style={styles.boldText}>Role Boundaries: </Text>Students may not attempt to access teacher or administrator control panels. Any unauthorized role privilege escalation attempts will result in immediate account termination.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>3. Examination Integrity & Academic Honesty</Text>
        </View>
        <Text style={styles.paragraph}>
          ZeePrep includes automated Computer-Based Testing (CBT) proctoring mechanisms to ensure fair assessment:
        </Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.boldText}>Proctoring Monitoring: </Text>During an active examination session, students must not minimize the application, switch between windows, or open unauthorized tools.{"\n"}
          • <Text style={styles.boldText}>Violation Policy: </Text>Repeated unauthorized app switches or window losses are logged automatically as telemetry violations. Severe or repeated violations will result in automatic exam termination and flagging for academic review.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ban size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>4. Prohibited Conduct</Text>
        </View>
        <Text style={styles.paragraph}>
          When using ZeePrep, you agree NOT to:
        </Text>
        <Text style={styles.paragraph}>
          • Reverse engineer, decompile, or disassemble any portion of the mobile APK, application bytecode, or API endpoints.{"\n"}
          • Scrape, extract, copy, or redistribute examination questions, answer keys, or proprietary teacher notes without written authorization.{"\n"}
          • Deploy automated scripts, bots, or spoofed requests to artificially alter exam scores, timers, or leaderboard rankings.{"\n"}
          • Upload malicious code, corrupted files, or inappropriate content to the study resources repository.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Scale size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>5. Intellectual Property Rights</Text>
        </View>
        <Text style={styles.paragraph}>
          All software code, user interface designs, logos, graphics, trademarks, question banks, and assessment blueprints contained in ZeePrep are the exclusive intellectual property of <Text style={styles.boldText}>Skillizee</Text> or its licensed institutional partners. All rights are reserved.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <AlertTriangle size={20} color="#D97706" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>6. Disclaimer & Limitation of Liability</Text>
        </View>
        <Text style={styles.paragraph}>
          ZeePrep is provided on an "as is" and "as available" basis for educational and diagnostic purposes. While we strive for 100% uptime and precise question evaluations, Skillizee makes no warranty that services will be uninterrupted or error-free during local device network outages. Skillizee shall not be liable for any indirect, incidental, or consequential damages resulting from the use of the platform.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Mail size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>7. Contact Us</Text>
        </View>
        <Text style={styles.paragraph}>
          For inquiries or support regarding these Terms and Conditions, please reach out to:
        </Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactName}>Skillizee Legal & Compliance Team</Text>
          <Text style={styles.contactItem}>📧 Email: <Text style={styles.contactLink}>support@skillizee.io</Text></Text>
          <Text style={styles.contactItem}>🌐 Website: <Text style={styles.contactLink}>https://zeeprep.skillizee.io</Text></Text>
        </View>
      </View>

      {/* 4. Bottom Footer Navigation */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.footerLinkBtn}
          onPress={() => router.push("/privacy-policy" as any)}
        >
          <Shield size={15} color="#4F46E5" style={{ marginRight: 5 }} />
          <Text style={styles.footerLinkText}>Privacy Policy</Text>
        </TouchableOpacity>

        <Text style={styles.footerDivider}>•</Text>

        <TouchableOpacity
          style={styles.footerLinkBtn}
          onPress={() => router.push("/delete-account" as any)}
        >
          <Text style={[styles.footerLinkText, { color: "#EF4444" }]}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.copyrightText}>
        © {new Date().getFullYear()} Skillizee. All rights reserved.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 50,
  },
  desktopContainer: {
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 32,
    paddingTop: 45,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 6,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.4)",
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#818CF8",
  },
  heroCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    textAlign: "center",
  },
  heroIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    width: "100%",
  },
  metaItem: {
    fontSize: 12,
    color: "#64748B",
  },
  metaBold: {
    color: "#CBD5E1",
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "700",
    color: "#0F172A",
  },
  contactCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginTop: 4,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  contactItem: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
  },
  contactLink: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    gap: 12,
  },
  footerLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#818CF8",
  },
  footerDivider: {
    color: "#475569",
    fontSize: 14,
  },
  copyrightText: {
    fontSize: 11.5,
    color: "#64748B",
    textAlign: "center",
  },
});
