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
  ShieldCheck,
  ArrowLeft,
  Lock,
  Eye,
  Database,
  Users,
  UserX,
  FileText,
  Mail,
  CheckCircle2,
  ExternalLink,
} from "lucide-react-native";

export default function PrivacyPolicyScreen() {
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
          <ShieldCheck size={16} color="#16A34A" style={{ marginRight: 5 }} />
          <Text style={styles.headerBadgeText}>Google Play Compliant</Text>
        </View>
      </View>

      {/* 2. Hero Header */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconCircle}>
          <ShieldCheck size={36} color="#4F46E5" />
        </View>
        <Text style={styles.heroTitle}>Privacy Policy</Text>
        <Text style={styles.heroSubtitle}>
          ZeePrep Smart Learning & CBT Examination Platform
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>App: <Text style={styles.metaBold}>ZeePrep (com.skillizee.zeeprep)</Text></Text>
          <Text style={styles.metaItem}>Developer: <Text style={styles.metaBold}>Skillizee</Text></Text>
          <Text style={styles.metaItem}>Effective Date: <Text style={styles.metaBold}>September 2026</Text></Text>
        </View>
      </View>

      {/* 3. Core Policy Sections */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Eye size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>1. Introduction & Scope</Text>
        </View>
        <Text style={styles.paragraph}>
          Skillizee ("we", "our", or "us") is dedicated to protecting the privacy and personal data of all students, teachers, parents, and school administrators who use our mobile application, <Text style={styles.boldText}>ZeePrep</Text> (Package ID: <Text style={styles.codeText}>com.skillizee.zeeprep</Text>), and related web platforms accessible at <Text style={styles.boldText}>https://zeeprep.skillizee.io</Text>.
        </Text>
        <Text style={styles.paragraph}>
          This Privacy Policy outlines how we collect, process, store, protect, and delete personal and educational data in full compliance with the Google Play Developer Policies, the Children's Online Privacy Protection Act (COPPA), FERPA, and general data protection standards.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Database size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        </View>
        <Text style={styles.paragraph}>
          To provide Computer-Based Tests (CBT), academic scorecards, and learning diagnostic features, ZeePrep collects the following categories of information:
        </Text>

        <View style={styles.bulletItem}>
          <CheckCircle2 size={16} color="#4F46E5" style={styles.bulletIcon} />
          <Text style={styles.bulletText}>
            <Text style={styles.boldText}>Account & Identification Data: </Text>
            Full name, email address, school-assigned Login ID (e.g., ZP-STU-1101), academic grade/class (e.g., Class 11), section, educational board (e.g., CBSE), and affiliated school name.
          </Text>
        </View>

        <View style={styles.bulletItem}>
          <CheckCircle2 size={16} color="#4F46E5" style={styles.bulletIcon} />
          <Text style={styles.bulletText}>
            <Text style={styles.boldText}>Examination & Academic Telemetry: </Text>
            Responses to examination questions, timestamps, time spent per question, marked-for-review indicators, calculated scores, accuracy percentages, and derived weak-topic insights.
          </Text>
        </View>

        <View style={styles.bulletItem}>
          <CheckCircle2 size={16} color="#4F46E5" style={styles.bulletIcon} />
          <Text style={styles.bulletText}>
            <Text style={styles.boldText}>Technical & Security Audit Data: </Text>
            Device operating system, application version, client IP address (solely for authorized login audit records and session verification), and temporary test proctoring state (app background/foreground status during active exams).
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Lock size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        </View>
        <Text style={styles.paragraph}>
          We process user information strictly for legitimate educational, operational, and security purposes:
        </Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.boldText}>Assessment & Evaluation: </Text>To administer online examinations, calculate test results, provide instant diagnostic scorecards, and show question explanations.{"\n"}
          • <Text style={styles.boldText}>Weak Topic Diagnosis: </Text>To highlight areas requiring revision and suggest relevant school study materials (PDFs, video notes).{"\n"}
          • <Text style={styles.boldText}>Institutional Progress: </Text>To allow authorized faculty and school administrators to view class-level performance and academic progression.{"\n"}
          • <Text style={styles.boldText}>Exam Integrity & Anti-Cheating: </Text>To monitor exam integrity during active test sessions and detect unauthorized app switching.{"\n"}
          • <Text style={styles.boldText}>Account Security: </Text>To verify identities, manage login sessions, and prevent unauthorized account access.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Users size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>4. Third-Party Service Providers & Subprocessors</Text>
        </View>
        <Text style={styles.paragraph}>
          ZeePrep utilizes industry-leading cloud infrastructure providers for authentication, database hosting, and educational diagnostics. All subprocessors are bound by strict data protection agreements:
        </Text>

        <View style={styles.subprocessorBox}>
          <Text style={styles.subprocessorTitle}>• Google Firebase (Google LLC)</Text>
          <Text style={styles.subprocessorDesc}>
            Provides secure user authentication (Firebase Auth), encrypted cloud database storage (Cloud Firestore), and curriculum file hosting (Firebase Storage). Data is hosted in secure Google Cloud data centers.
          </Text>
        </View>

        <View style={styles.subprocessorBox}>
          <Text style={styles.subprocessorTitle}>• Google Gemini API (Google LLC)</Text>
          <Text style={styles.subprocessorDesc}>
            Provides AI-assisted topic matching and teacher copilot suggestions. No student personal information is sent to Gemini, and data is NOT used for training AI models.
          </Text>
        </View>

        <View style={styles.subprocessorBox}>
          <Text style={styles.subprocessorTitle}>• Expo / EAS (650 Industries, Inc.)</Text>
          <Text style={styles.subprocessorDesc}>
            Provides mobile application build runtime and encrypted local storage modules (<Text style={styles.codeText}>expo-secure-store</Text>).
          </Text>
        </View>
      </View>

      <View style={styles.highlightCard}>
        <Text style={styles.highlightTitle}>🚫 Zero Commercial Advertising & No Sale of Data</Text>
        <Text style={styles.highlightText}>
          ZeePrep is 100% ad-free. We do NOT display commercial advertisements, third-party trackers, or marketing popups. We <Text style={styles.boldText}>NEVER sell, rent, monetize, or trade</Text> student, teacher, or parental personal data with third-party advertisers or data brokers under any circumstances.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <ShieldCheck size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>5. Children's & Student Privacy (COPPA Compliance)</Text>
        </View>
        <Text style={styles.paragraph}>
          ZeePrep is designed for educational use by schools, teachers, and students (including minors under the age of 18).
        </Text>
        <Text style={styles.paragraph}>
          • Student accounts are created and managed under the authorization and supervision of participating schools, institutions, or verified guardians.{"\n"}
          • We collect only the minimum necessary information required to deliver educational testing and curriculum analytics.{"\n"}
          • Parents and legal guardians have the right to review their child's academic records, request modifications, or demand the deletion of their child's personal data at any time by contacting us or their child's school administration.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Lock size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>6. Data Security & Storage</Text>
        </View>
        <Text style={styles.paragraph}>
          We apply enterprise-grade security standards to safeguard all user information:
        </Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.boldText}>Encryption in Transit: </Text>All communications between the ZeePrep app and our cloud backend are encrypted using Transport Layer Security (TLS 1.3 / HTTPS).{"\n"}
          • <Text style={styles.boldText}>Encryption at Rest: </Text>Device authentication tokens and cached scorecards are protected with AES-256 hardware encryption via <Text style={styles.codeText}>expo-secure-store</Text> (Android Keystore).{"\n"}
          • <Text style={styles.boldText}>Role-Based Access Control: </Text>Granular Firestore security rules restrict data visibility so students only access their own assessments, and teachers only access assigned classes.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <UserX size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>7. Data Retention & Account Deletion (Google Play Compliance)</Text>
        </View>
        <Text style={styles.paragraph}>
          Users retain full control over their personal and educational records:
        </Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.boldText}>Retention: </Text>We retain user data only for as long as the account remains active or as required by the associated school curriculum session.{"\n"}
          • <Text style={styles.boldText}>Right to Deletion: </Text>You may permanently delete your account and all associated test records, scores, and personal profile data at any time.
        </Text>

        <TouchableOpacity
          style={styles.deletePortalBtn}
          onPress={() => router.push("/delete-account" as any)}
          activeOpacity={0.85}
        >
          <UserX size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.deletePortalBtnText}>Open Account & Data Deletion Portal</Text>
        </TouchableOpacity>
        <Text style={styles.smallNote}>
          Alternatively, you can email our Data Protection Officer at <Text style={styles.boldText}>support@skillizee.io</Text> with your registered email or Login ID to request manual purging within 30 days.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Mail size={20} color="#4F46E5" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>8. Contact Information</Text>
        </View>
        <Text style={styles.paragraph}>
          If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
        </Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactName}>Skillizee — ZeePrep Support & Privacy Team</Text>
          <Text style={styles.contactItem}>📧 Email: <Text style={styles.contactLink}>support@skillizee.io</Text></Text>
          <Text style={styles.contactItem}>🌐 Web Portal: <Text style={styles.contactLink}>https://zeeprep.skillizee.io</Text></Text>
          <Text style={styles.contactItem}>📍 App Package: <Text style={styles.codeText}>com.skillizee.zeeprep</Text></Text>
        </View>
      </View>

      {/* 4. Bottom Footer Navigation */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.footerLinkBtn}
          onPress={() => router.push("/terms" as any)}
        >
          <FileText size={15} color="#4F46E5" style={{ marginRight: 5 }} />
          <Text style={styles.footerLinkText}>Terms & Conditions</Text>
        </TouchableOpacity>

        <Text style={styles.footerDivider}>•</Text>

        <TouchableOpacity
          style={styles.footerLinkBtn}
          onPress={() => router.push("/delete-account" as any)}
        >
          <UserX size={15} color="#EF4444" style={{ marginRight: 5 }} />
          <Text style={[styles.footerLinkText, { color: "#EF4444" }]}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.copyrightText}>
        © {new Date().getFullYear()} Skillizee. All rights reserved. ZeePrep is a trademark of Skillizee.
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
    backgroundColor: "rgba(22, 163, 74, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(22, 163, 74, 0.4)",
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4ADE80",
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
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12.5,
    backgroundColor: "#F1F5F9",
    color: "#4F46E5",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletIcon: {
    marginTop: 3,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 21,
    color: "#334155",
  },
  subprocessorBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  subprocessorTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  subprocessorDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#475569",
  },
  highlightCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3730A3",
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: "#312E81",
  },
  deletePortalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  deletePortalBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  smallNote: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
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
