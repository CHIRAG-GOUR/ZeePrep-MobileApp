import { NativeModules, Platform } from "react-native";

/**
 * Role-Based Screen Protection Controller
 * - SuperAdmin: Screenshots & Screen Recordings are ALLOWED (FLAG_SECURE cleared).
 * - Admin / Teacher / Student / Guests: Screenshots & Screen Recordings are BLOCKED (FLAG_SECURE enforced).
 */
export function configureScreenSecurity(role?: string) {
  if (Platform.OS !== "android") return;

  try {
    const { ScreenSecurityModule } = NativeModules;
    if (!ScreenSecurityModule) return;

    if (role === "superadmin") {
      // Allow screenshot taking for Super Admin ONLY
      ScreenSecurityModule.allowScreenshots(true);
    } else {
      // Enforce anti-screenshot & anti-recording shield for all other roles
      ScreenSecurityModule.allowScreenshots(false);
    }
  } catch (err) {
    console.warn("Screen security configuration notice:", err);
  }
}
