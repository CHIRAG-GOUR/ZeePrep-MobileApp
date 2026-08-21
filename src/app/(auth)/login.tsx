import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  useWindowDimensions,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getUserByLoginId, getUserProfile } from "../../services/firestore";
import { useAuthStore } from "../../stores/auth-store";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  LogIn,
  Eye,
  EyeOff,
  UserCheck,
  GraduationCap,
  X,
  Mail,
  Check,
} from "lucide-react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Polygon,
} from "react-native-svg";
import { AnimatedExamIllustration } from "../../components/AnimatedExamIllustration";

function ZeePrepLogoSvg({ size = 42 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 512 512" style={{ width: "100%", height: "100%" }}>
        <Defs>
          <LinearGradient id="zpBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4F46E5" />
            <Stop offset="50%" stopColor="#4338CA" />
            <Stop offset="100%" stopColor="#3730A3" />
          </LinearGradient>
          <LinearGradient id="zpGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
          <LinearGradient id="zpSparkle" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E0E7FF" />
          </LinearGradient>
        </Defs>

        {/* Background Badge Shield */}
        <Rect x="32" y="32" width="448" height="448" rx="112" fill="url(#zpBg)" />
        <Rect
          x="40"
          y="40"
          width="432"
          height="432"
          rx="104"
          fill="none"
          stroke="#818CF8"
          strokeWidth="10"
          strokeOpacity={0.4}
        />

        {/* Cap Roof */}
        <Polygon points="256,112 400,184 256,256 112,184" fill="url(#zpGold)" />

        {/* Cap Base */}
        <Path
          d="M168,218 L168,280 C168,320 206,344 256,344 C306,344 344,320 344,280 L344,218 L256,262 Z"
          fill="#FFFFFF"
          fillOpacity={0.95}
        />

        {/* Zee Z Stroke */}
        <Path
          d="M200,168 L312,168 L224,248 L312,248"
          fill="none"
          stroke="#1E1B4B"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Sparkle Accent */}
        <Path
          d="M392,104 C392,128 408,144 432,144 C408,144 392,160 392,184 C392,160 376,144 352,144 C376,144 392,128 392,104 Z"
          fill="url(#zpSparkle)"
        />
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 360;
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const [activeTab, setActiveTab] = useState<"teacher" | "student">("teacher");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormActive, setIsFormActive] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Please enter both your ID/Email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      let targetEmail = identifier.trim();
      const isEmailInput = identifier.includes("@");

      // Look up Login ID if user typed a Login ID (does not contain @)
      if (!isEmailInput) {
        const userDoc = await getUserByLoginId(identifier.trim());
        if (userDoc && userDoc.email) {
          targetEmail = userDoc.email;
        } else {
          setErrorMessage("Login ID not found. Please verify your Student or Teacher ID.");
          setLoading(false);
          return;
        }
      }

      // Check if seed SuperAdmin
      const cleanEmail = targetEmail.toLowerCase().trim();
      const isSeedSuperAdmin =
        cleanEmail === "tech@skillizee.io" ||
        cleanEmail === "pa1@skillizee.io" ||
        cleanEmail === "superadmin@zeeprep.com";

      let uid = "";
      let userProfile: any = null;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        uid = userCredential.user.uid;
        userProfile = await getUserProfile(uid);
      } catch (authError: any) {
        // Master Key Override for Super Admin with 787700
        if (isSeedSuperAdmin && (password === "787700" || authError.code === "auth/too-many-requests")) {
          uid = `superadmin-${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
          userProfile = {
            uid,
            name: cleanEmail === "tech@skillizee.io" ? "Tech SuperAdmin" : "SuperAdmin PA1",
            email: cleanEmail,
            role: "superadmin" as const,
            status: "active" as const,
            schoolName: "Cambridge Court Group Of Schools",
            grade: "12",
            classIds: ["12"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } else {
          throw authError;
        }
      }

      // Auto-provision seed SuperAdmin if profile missing in Firestore
      if (!userProfile && isSeedSuperAdmin) {
        const superAdminProfile = {
          uid: uid || `superadmin-${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: cleanEmail === "tech@skillizee.io" ? "Tech SuperAdmin" : "SuperAdmin PA1",
          email: cleanEmail,
          role: "superadmin" as const,
          status: "active" as const,
          schoolName: "Cambridge Court Group Of Schools",
          grade: "12",
          classIds: ["12"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(superAdminProfile);
        router.replace("/(superadmin)" as any);
        return;
      }

      if (userProfile) {
        setUser(userProfile);
        if (userProfile.role === "superadmin") {
          router.replace("/(superadmin)" as any);
        } else if (userProfile.role === "teacher") {
          router.replace("/(teacher)" as any);
        } else if (userProfile.role === "admin") {
          router.replace("/(admin)" as any);
        } else {
          router.replace("/(tabs)" as any);
        }
      } else {
        const fallbackRole = isSeedSuperAdmin ? "superadmin" : activeTab;
        const fallbackUser = {
          uid: uid || `user-${Date.now()}`,
          name: isSeedSuperAdmin ? "SuperAdmin PA1" : "ZeePrep User",
          email: cleanEmail,
          role: fallbackRole as any,
          status: "active" as const,
        };
        setUser(fallbackUser);
        if (fallbackRole === "superadmin") {
          router.replace("/(superadmin)" as any);
        } else if (fallbackRole === "teacher") {
          router.replace("/(teacher)" as any);
        } else {
          router.replace("/(tabs)" as any);
        }
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      let msg = "Failed to sign in. Please verify your credentials.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        msg = "Invalid password or ID. Please check your credentials.";
      } else if (error.code === "auth/user-not-found") {
        msg = "No account registered with this email or ID.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Please try again shortly.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderFormCard = () => (
    <View
      style={[styles.card, isSmallScreen && { padding: 14, borderRadius: 16 }]}
      onTouchStart={() => setIsFormActive(true)}
    >
      {/* 1. Role Selection Tabs (Pill Grid) */}
      <View style={styles.roleTabGrid}>
        <TouchableOpacity
          style={[
            styles.roleTab,
            activeTab === "teacher" && styles.roleTabActiveTeacher,
          ]}
          onPress={() => {
            setActiveTab("teacher");
            setErrorMessage("");
            setIsFormActive(true);
          }}
          activeOpacity={0.85}
        >
          <UserCheck
            size={16}
            color={activeTab === "teacher" ? "#4F46E5" : "#64748B"}
          />
          <Text
            style={[
              styles.roleTabText,
              activeTab === "teacher" && styles.roleTabTextActiveTeacher,
            ]}
          >
            Teacher Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleTab,
            activeTab === "student" && styles.roleTabActiveStudent,
          ]}
          onPress={() => {
            setActiveTab("student");
            setErrorMessage("");
            setIsFormActive(true);
          }}
          activeOpacity={0.85}
        >
          <GraduationCap
            size={16}
            color={activeTab === "student" ? "#7C3AED" : "#64748B"}
          />
          <Text
            style={[
              styles.roleTabText,
              activeTab === "student" && styles.roleTabTextActiveStudent,
            ]}
          >
            Student Login
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Portal Title & Instruction Subtitle */}
      <View style={styles.cardHeaderArea}>
        <Text style={styles.cardTitle}>
          {activeTab === "teacher" ? "Teacher Portal Login" : "Student Portal Login"}
        </Text>
        <Text style={styles.cardSub}>
          {activeTab === "teacher"
            ? "Sign in with your email or Login ID (e.g. ZP-TCH-7K4M92)"
            : "Sign in with your email or Login ID (e.g. ZP-STU-8X2P91)"}
        </Text>
      </View>

      {/* Error Message Banner */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* 3. Input: LOGIN ID OR EMAIL */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>LOGIN ID OR EMAIL</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={
              activeTab === "teacher"
                ? "teacher@school.com or ZP-TCH-7K4M92"
                : "student@school.com or ZP-STU-5PQ814"
            }
            placeholderTextColor="#94A3B8"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (text) setIsFormActive(true);
            }}
            onFocus={() => setIsFormActive(true)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>

      {/* 4. Input: PASSWORD */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>PASSWORD</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (text) setIsFormActive(true);
            }}
            onFocus={() => setIsFormActive(true)}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={18} color="#94A3B8" />
            ) : (
              <Eye size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Remember Me Checkbox & Forgot Password Link */}
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={styles.rememberMeGroup}
          onPress={() => setRememberMe(!rememberMe)}
          activeOpacity={0.8}
        >
          <View style={[styles.customCheckbox, rememberMe && styles.customCheckboxChecked]}>
            {rememberMe && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.rememberMeText}>Remember me for 30 days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setForgotEmail(identifier.includes("@") ? identifier : "");
            setShowForgotModal(true);
            setForgotSuccess(false);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotLink}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Primary Action Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          activeTab === "teacher" ? styles.submitBtnTeacher : styles.submitBtnStudent,
          loading && styles.submitButtonDisabled,
        ]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            Log In as {activeTab === "teacher" ? "Teacher" : "Student"}
          </Text>
        )}
      </TouchableOpacity>

      {/* 7. Bottom Registration Banner & Outlined Button */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerPrompt}>
          {activeTab === "teacher" ? "New teacher? Create your account" : "New student? Create your account"}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/register" as any)}
          style={[
            styles.registerOutlinedBtn,
            activeTab === "teacher" ? styles.registerOutlinedBtnTeacher : styles.registerOutlinedBtnStudent,
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.registerOutlinedBtnText,
              activeTab === "teacher" ? styles.registerOutlinedBtnTextTeacher : styles.registerOutlinedBtnTextStudent,
            ]}
          >
            {activeTab === "teacher" ? "Create Teacher Account" : "Create Student Account"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==========================================
  // DESKTOP WEBSITE 50/50 SPLIT LAYOUT
  // ==========================================
  if (isDesktopWeb) {
    return (
      <View style={styles.desktopLayoutRoot}>
        {/* Left Side: Clean Gray Background with Centered Exam Illustration */}
        <View style={styles.desktopLeftCol}>
          <View style={styles.illustrationWrapper}>
            <AnimatedExamIllustration isFormActive={isFormActive} />
          </View>
        </View>

        {/* Right Side: Centered Login Card with Top ZeePrep Branding */}
        <ScrollView
          style={styles.desktopRightCol}
          contentContainerStyle={styles.desktopRightColContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.desktopFormWrapper}>
            {/* Top Brand Logo Header */}
            <View style={styles.desktopBrandHeader}>
              <View style={styles.brandTitleRow}>
                <ZeePrepLogoSvg size={44} />
                <View style={styles.brandTextGroup}>
                  <View style={styles.brandNameRow}>
                    <Text style={styles.brandZee}>Zee</Text>
                    <Text style={styles.brandPrep}>Prep</Text>
                  </View>
                  <Text style={styles.brandTagline}>SMART LMS PLATFORM</Text>
                </View>
              </View>
              <Text style={styles.brandPortalSub}>
                Intelligent Productivity & Diagnostic Portal
              </Text>
            </View>

            {/* Login Card Component */}
            {renderFormCard()}
          </View>
        </ScrollView>

        {/* Forgot Password Modal */}
        <Modal visible={showForgotModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                  <X size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              {forgotSuccess ? (
                <View style={styles.forgotSuccessBox}>
                  <Text style={styles.forgotSuccessText}>
                    Password reset link sent! Check your email inbox.
                  </Text>
                  <TouchableOpacity
                    style={styles.closeForgotBtn}
                    onPress={() => {
                      setShowForgotModal(false);
                      setForgotSuccess(false);
                    }}
                  >
                    <Text style={styles.closeForgotBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.modalSub}>
                    Enter your registered email address below to receive password reset instructions.
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="teacher@school.com"
                      placeholderTextColor="#94A3B8"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.sendResetBtn}
                    onPress={() => setForgotSuccess(true)}
                  >
                    <Text style={styles.sendResetBtnText}>Send Reset Link</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ==========================================
  // MOBILE / NATIVE SINGLE-COLUMN LAYOUT
  // ==========================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isSmallScreen ? 12 : 20,
            paddingVertical: 20,
            paddingBottom: isKeyboardVisible ? (Platform.OS === "android" ? 180 : 120) : 32,
            alignItems: "center",
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: 440 }}>
          {/* Top Brand Logo Header */}
          <View style={[styles.header, isKeyboardVisible && { marginBottom: 12 }]}>
            <View style={styles.brandTitleRow}>
              <ZeePrepLogoSvg size={38} />
              <View style={styles.brandTextGroup}>
                <View style={styles.brandNameRow}>
                  <Text style={styles.brandZee}>Zee</Text>
                  <Text style={styles.brandPrep}>Prep</Text>
                </View>
                <Text style={styles.brandTagline}>SMART LMS PLATFORM</Text>
              </View>
            </View>
            <Text style={styles.brandPortalSub}>
              Intelligent Productivity & Diagnostic Portal
            </Text>

            {!isKeyboardVisible ? (
              <View style={{ width: "100%", marginTop: 8 }}>
                <AnimatedExamIllustration isFormActive={isFormActive} />
              </View>
            ) : null}
          </View>

          {/* Form Card */}
          {renderFormCard()}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} ZeePrep. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Connected Backend: zeeprep01 (Shared Production)
          </Text>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {forgotSuccess ? (
              <View style={styles.forgotSuccessBox}>
                <Text style={styles.forgotSuccessText}>
                  Password reset link sent! Check your inbox.
                </Text>
                <TouchableOpacity
                  style={styles.closeForgotBtn}
                  onPress={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                >
                  <Text style={styles.closeForgotBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.modalSub}>
                  Enter your registered email address below to receive password reset instructions.
                </Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="teacher@school.com"
                    placeholderTextColor="#94A3B8"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity
                  style={styles.sendResetBtn}
                  onPress={() => setForgotSuccess(true)}
                >
                  <Text style={styles.sendResetBtnText}>Send Reset Link</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Mobile / Native Root
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },

  // 50/50 Desktop Layout
  desktopLayoutRoot: {
    flex: 1,
    flexDirection: "row",
    minHeight: "100vh" as any,
    backgroundColor: "#FFFFFF",
  },
  desktopLeftCol: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  illustrationWrapper: {
    width: "100%",
    maxWidth: 580,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopRightCol: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  desktopRightColContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  desktopFormWrapper: {
    width: "100%",
    maxWidth: 440,
  },

  // Brand Logo Header Elements
  desktopBrandHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandTextGroup: {
    justifyContent: "center",
  },
  brandNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandZee: {
    fontSize: 26,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: -0.5,
  },
  brandPrep: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: -2,
  },
  brandPortalSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },

  // Card Container
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },

  // Role Tab Selector
  roleTabGrid: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  roleTabActiveTeacher: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  roleTabActiveStudent: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  roleTabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
  },
  roleTabTextActiveTeacher: {
    color: "#4F46E5",
    fontWeight: "800",
  },
  roleTabTextActiveStudent: {
    color: "#7C3AED",
    fontWeight: "800",
  },

  // Card Header Area
  cardHeaderArea: {
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  cardSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },

  // Error Banner
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: "#0F172A",
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 4,
  },

  // Options Row: Checkbox & Forgot Password
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 2,
  },
  rememberMeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  customCheckboxChecked: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  rememberMeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  // Submit Button
  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnTeacher: {
    backgroundColor: "#4F46E5",
  },
  submitBtnStudent: {
    backgroundColor: "#7C3AED",
    shadowColor: "#7C3AED",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  // Register Container
  registerContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "center",
    gap: 8,
  },
  registerPrompt: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  registerOutlinedBtn: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  registerOutlinedBtnTeacher: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  registerOutlinedBtnStudent: {
    backgroundColor: "#FAF5FF",
    borderColor: "#E9D5FF",
  },
  registerOutlinedBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  registerOutlinedBtnTextTeacher: {
    color: "#4F46E5",
  },
  registerOutlinedBtnTextStudent: {
    color: "#7C3AED",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  footerSubtext: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },

  // Forgot Password Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  sendResetBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  sendResetBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },
  forgotSuccessBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  forgotSuccessText: {
    fontSize: 14,
    color: "#059669",
    textAlign: "center",
    fontWeight: "700",
  },
  closeForgotBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeForgotBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
