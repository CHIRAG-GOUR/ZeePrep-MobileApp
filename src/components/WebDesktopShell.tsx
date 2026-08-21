import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useAuthStore, isSuperAdminUser } from "../stores/auth-store";
import { logoutUser } from "../services/auth";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Polygon,
} from "react-native-svg";
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  FileBarChart,
  BookOpen,
  User,
  Trophy,
  Bot,
  Activity,
  HelpCircle,
  FileCheck,
  Users,
  ShieldAlert,
  Layers,
  TrendingUp,
  Settings,
  LogOut,
  Search,
  ChevronRight,
  Shield,
  Menu,
  X,
  Award,
  Bell,
  ChevronDown,
  FileSpreadsheet,
  Brain,
} from "lucide-react-native";
import { AICopilotModal } from "./AICopilotModal";

interface WebDesktopShellProps {
  children?: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

function ZeePrepLogoSvg({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 512 512" style={{ width: "100%", height: "100%" }}>
        <Defs>
          <LinearGradient id="zpBgWeb" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4F46E5" />
            <Stop offset="50%" stopColor="#4338CA" />
            <Stop offset="100%" stopColor="#3730A3" />
          </LinearGradient>
          <LinearGradient id="zpGoldWeb" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
          <LinearGradient id="zpSparkleWeb" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E0E7FF" />
          </LinearGradient>
        </Defs>
        <Rect x="32" y="32" width="448" height="448" rx="112" fill="url(#zpBgWeb)" />
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
        <Polygon points="256,112 400,184 256,256 112,184" fill="url(#zpGoldWeb)" />
        <Path
          d="M168,218 L168,280 C168,320 206,344 256,344 C306,344 344,320 344,280 L344,218 L256,262 Z"
          fill="#FFFFFF"
          fillOpacity={0.95}
        />
        <Path
          d="M200,168 L312,168 L224,248 L312,248"
          fill="none"
          stroke="#1E1B4B"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M392,104 C392,128 408,144 432,144 C408,144 392,160 392,184 C392,160 376,144 352,144 C376,144 392,128 392,104 Z"
          fill="url(#zpSparkleWeb)"
        />
      </Svg>
    </View>
  );
}

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/(tabs)", icon: LayoutDashboard },
  { label: "My Exams", href: "/(tabs)/exams", icon: Brain },
  { label: "Study Resources", href: "/(tabs)/resources", icon: Layers },
  { label: "Leaderboard", href: "/(tabs)/leaderboard", icon: Trophy },
  { label: "Reports", href: "/(tabs)/reports", icon: FileText },
  { label: "AI Study Tutor", href: "/(tabs)/ai-tutor", icon: Bot },
  { label: "Profile", href: "/(tabs)/profile", icon: User },
];

const teacherNavItems: NavItem[] = [
  { label: "Dashboard", href: "/(teacher)", icon: LayoutDashboard },
  { label: "Live Monitor", href: "/(teacher)/submissions", icon: Activity },
  { label: "Question Bank", href: "/(teacher)/question-bank", icon: BookOpen },
  { label: "Active Exams", href: "/(teacher)/exams", icon: Brain },
  { label: "Study Resources", href: "/(teacher)/resources", icon: Layers },
  { label: "Student Roster", href: "/(teacher)/roster", icon: Users },
  { label: "Reports", href: "/(teacher)/reports", icon: FileText },
  { label: "Profile", href: "/(teacher)/profile", icon: User },
];

const superAdminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/(superadmin)", icon: LayoutDashboard },
  { label: "Live Monitor", href: "/(superadmin)/submissions", icon: Activity },
  { label: "User Control", href: "/(admin)/user-management", icon: Users },
  { label: "Classes & Hierarchy", href: "/(superadmin)/academic-hierarchy", icon: Layers },
  { label: "Question Bank", href: "/(superadmin)/question-bank", icon: FileSpreadsheet },
  { label: "Exams", href: "/(superadmin)/exams", icon: Brain },
  { label: "Study Resources", href: "/(superadmin)/resources", icon: Layers },
  { label: "Reports", href: "/(superadmin)/reports", icon: FileText },
  { label: "Analytics Hub", href: "/(superadmin)/analytics", icon: TrendingUp },
  { label: "Audit Logs", href: "/(superadmin)/audit-logs", icon: Activity },
  { label: "Settings", href: "/(superadmin)/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/(admin)", icon: LayoutDashboard },
  { label: "Live Monitor", href: "/(teacher)/submissions", icon: Activity },
  { label: "User Control", href: "/(admin)/user-management", icon: Users },
  { label: "Classes & Hierarchy", href: "/(admin)/academic-hierarchy", icon: Layers },
  { label: "Question Bank", href: "/(admin)/question-bank", icon: FileSpreadsheet },
  { label: "Exams", href: "/(superadmin)/exams", icon: Brain },
  { label: "Study Resources", href: "/(admin)/resources", icon: Layers },
  { label: "Reports", href: "/(admin)/reports", icon: FileText },
  { label: "Profile", href: "/(admin)/profile", icon: User },
];

export function WebDesktopShell({ children }: WebDesktopShellProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, viewMode, setViewMode } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Only apply desktop web layout on Web platform
  if (Platform.OS !== "web") {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  const isAuthScreen = pathname.includes("/(auth)") || pathname.includes("/login") || pathname.includes("/register");
  const isExamScreen = pathname.startsWith("/exam/");
  const isDesktop = width >= 860;

  // If in auth screen, render full-viewport web page without sidebar
  if (isAuthScreen || !isAuthenticated || !user) {
    return (
      <View style={styles.webRoot}>
        {children}
      </View>
    );
  }

  // Determine navigation items based on active role/viewMode
  const activeRole = isSuperAdminUser(user) ? (viewMode || "superadmin") : user.role;
  let navItems = studentNavItems;
  if (activeRole === "superadmin") {
    navItems = superAdminNavItems;
  } else if (activeRole === "admin") {
    navItems = adminNavItems;
  } else if (activeRole === "teacher") {
    navItems = teacherNavItems;
  }

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/(auth)/login" as any);
  };

  const handleSwitchViewMode = (newMode: "superadmin" | "teacher" | "student") => {
    setViewMode(newMode);
    if (newMode === "superadmin") router.replace("/(superadmin)" as any);
    else if (newMode === "teacher") router.replace("/(teacher)" as any);
    else router.replace("/(tabs)" as any);
  };

  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SA";

  return (
    <View style={styles.webRoot}>
      {/* 1. TOPBAR HEADER */}
      <View style={styles.topbar}>
        {/* Left: Brand Identity & Mobile Hamburger */}
        <View style={styles.topbarLeft}>
          {!isDesktop && (
            <TouchableOpacity
              style={styles.menuToggleBtn}
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
              activeOpacity={0.7}
            >
              {mobileMenuOpen ? <X size={20} color="#0F172A" /> : <Menu size={20} color="#0F172A" />}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.brandLogoBox}
            onPress={() => {
              if (activeRole === "superadmin") router.push("/(superadmin)");
              else if (activeRole === "teacher") router.push("/(teacher)");
              else router.push("/(tabs)");
            }}
            activeOpacity={0.85}
          >
            <ZeePrepLogoSvg size={30} />
            <View style={{ marginLeft: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.brandZee}>Zee</Text>
                <Text style={styles.brandPrep}>Prep</Text>
              </View>
              <Text style={styles.brandSub}>SMART LMS PLATFORM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Center: Global Search Bar (Desktop Only) */}
        {isDesktop && !isExamScreen && (
          <View style={styles.searchBarContainer}>
            <Search size={14} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Global search across exams, questions, topics, candidates..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {/* Right: Quick Action Controls, View Mode, Profile, Logout */}
        <View style={styles.topbarRight}>
          {/* AI Copilot Button */}
          <TouchableOpacity
            style={styles.aiTutorBtn}
            onPress={() => setCopilotOpen(true)}
            activeOpacity={0.8}
          >
            <Bot size={15} color="#FFFFFF" />
            <Text style={styles.aiTutorBtnText}>AI Copilot</Text>
          </TouchableOpacity>

          {/* Notifications Bell */}
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Bell size={16} color="#64748B" />
          </TouchableOpacity>

          {/* Super Admin View Mode Switcher */}
          {isSuperAdminUser(user) && (
            <View style={styles.viewModeContainer}>
              <Text style={styles.viewModeLabel}>VIEW MODE:</Text>
              <View style={styles.viewModeSelectBox}>
                <select
                  value={activeRole}
                  onChange={(e) => handleSwitchViewMode(e.target.value as any)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#0F172A",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </View>
            </View>
          )}

          {/* User Profile Capsule */}
          <View style={styles.userProfileCapsule}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{userInitials}</Text>
            </View>
            <View style={styles.userMetaText}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name || "Super Admin"}
              </Text>
              <View style={styles.userRoleBadgeWrapper}>
                <Text style={styles.userRoleBadge}>{activeRole.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            accessibilityLabel="Sign out"
            activeOpacity={0.7}
          >
            <LogOut size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. BODY: SIDEBAR + MAIN WEBSITE CONTENT */}
      <View style={styles.bodyLayout}>
        {/* Desktop Fixed Left Sidebar */}
        {isDesktop && !isExamScreen && (
          <View style={styles.sidebarWrapper}>
            <View style={styles.sidebarInner}>
              {/* Header Logo Badge matching original website */}
              <View style={styles.sidebarLogoHeader}>
                <View style={styles.sidebarLogoIconCircle}>
                  <GraduationCap size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.sidebarLogoTitle}>ZeePrep</Text>
              </View>

              {/* Navigation Items List */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={styles.navList}>
                  {navItems.map((item, idx) => {
                    const IconComp = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/(tabs)" &&
                        item.href !== "/(teacher)" &&
                        item.href !== "/(superadmin)" &&
                        item.href !== "/(admin)" &&
                        pathname.startsWith(item.href));

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.navItem,
                          isActive ? styles.navItemActive : styles.navItemInactive,
                        ]}
                        onPress={() => router.push(item.href as any)}
                        activeOpacity={0.85}
                      >
                        <IconComp
                          size={18}
                          color={isActive ? "#FFFFFF" : "#64748B"}
                        />
                        <Text
                          style={[
                            styles.navItemLabel,
                            isActive ? styles.navItemLabelActive : styles.navItemLabelInactive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.sidebarFooter}>
                <Text style={styles.sidebarVersionText}>ZEEPREP PLATFORM V2.5</Text>
              </View>
            </View>
          </View>
        )}

        {/* Mobile Slide-Out Menu for Small Browser Windows */}
        {!isDesktop && mobileMenuOpen && (
          <View style={styles.mobileNavOverlay}>
            <ScrollView style={styles.mobileNavCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={styles.sidebarSectionHeading}>MENU NAVIGATION</Text>
                <TouchableOpacity onPress={() => setMobileMenuOpen(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={styles.navList}>
                {navItems.map((item, idx) => {
                  const IconComp = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.navItem, isActive && styles.navItemActive]}
                      onPress={() => {
                        setMobileMenuOpen(false);
                        router.push(item.href as any);
                      }}
                      activeOpacity={0.8}
                    >
                      <IconComp size={18} color={isActive ? "#FFFFFF" : "#64748B"} />
                      <Text style={[styles.navItemLabel, isActive && styles.navItemLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Main Website Surface */}
        <View style={styles.mainContentSurface}>
          <div className="animate-page-entrance" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <View style={styles.contentContainer}>
              {children}
            </View>
          </div>
        </View>
      </View>

      {/* AI Copilot Interactive Modal */}
      <AICopilotModal isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    width: "100%",
    minHeight: "100vh" as any,
    backgroundColor: "#F4F5F9",
  },
  topbar: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 100,
  },
  topbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuToggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  brandLogoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandZee: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: -0.5,
  },
  brandPrep: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 8,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  searchBarContainer: {
    flex: 1,
    maxWidth: 420,
    marginHorizontal: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: "#0F172A",
    fontWeight: "500",
  },
  topbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiTutorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  aiTutorBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bellBtn: {
    padding: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  viewModeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 6,
  },
  viewModeLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.4,
  },
  viewModeSelectBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  userProfileCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userMetaText: {
    display: "flex",
  },
  userName: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  userRoleBadgeWrapper: {
    backgroundColor: "#EEF2FF",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: "flex-start",
    marginTop: 1,
  },
  userRoleBadge: {
    fontSize: 8,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 20,
  },
  bodyLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarWrapper: {
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    flexDirection: "column",
    flexShrink: 0,
    minHeight: "100%" as any,
  },
  sidebarInner: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  sidebarLogoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
    marginBottom: 8,
  },
  sidebarLogoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sidebarLogoTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  sidebarSectionHeading: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  navItemActive: {
    backgroundColor: "#4F46E5",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  navItemInactive: {
    backgroundColor: "transparent",
  },
  navItemLabel: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  navItemLabelActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  navItemLabelInactive: {
    color: "#475569",
  },
  sidebarFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarVersionText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.6,
  },
  mobileNavOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    zIndex: 999,
    padding: 16,
  },
  mobileNavCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  mainContentSurface: {
    flex: 1,
    backgroundColor: "#F4F5F9",
    overflow: "hidden",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
});
