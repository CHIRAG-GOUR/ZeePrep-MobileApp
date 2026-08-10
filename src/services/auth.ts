import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserByLoginId, getUserProfile } from "./firestore";
import { useAuthStore } from "../stores/auth-store";
import type { User } from "../types";

export interface LoginResult {
  success: boolean;
  user?: User;
  errorMessage?: string;
}

export async function loginWithIdentifier(
  identifier: string,
  pass: string
): Promise<LoginResult> {
  const cleanIdentifier = identifier.trim();
  const cleanPass = pass.trim();

  if (!cleanIdentifier || !cleanPass) {
    return { success: false, errorMessage: "Please provide both ID/Email and password." };
  }

  try {
    let targetEmail = cleanIdentifier;

    // Check if identifier is a Login ID (e.g. ZP-STU-1002, ZP-TEA-101) or non-email string
    if (!cleanIdentifier.includes("@")) {
      const userFromLoginId = await getUserByLoginId(cleanIdentifier);
      if (userFromLoginId && userFromLoginId.email) {
        targetEmail = userFromLoginId.email;
      } else {
        return {
          success: false,
          errorMessage: "Invalid Login ID. Please verify your Student or Teacher ID.",
        };
      }
    }

    // Firebase Auth login
    const credential = await signInWithEmailAndPassword(auth, targetEmail, cleanPass);
    const uid = credential.user.uid;

    // Fetch authoritative profile from Firestore
    const profile = await getUserProfile(uid);

    if (!profile) {
      return {
        success: false,
        errorMessage: "User profile not found in ZeePrep database. Please contact school admin.",
      };
    }

    if (profile.status === "disabled" || profile.status === "rejected") {
      return {
        success: false,
        errorMessage: "Your account is disabled or rejected. Please contact school administration.",
      };
    }

    if (profile.status === "pending") {
      return {
        success: false,
        errorMessage: "Your account approval is pending administrator review.",
      };
    }

    // Set user in Zustand + SecureStore
    useAuthStore.getState().setUser(profile);
    return { success: true, user: profile };
  } catch (error: any) {
    console.error("Firebase Login Error:", error);
    let msg = "Failed to sign in. Please check network connection and credentials.";
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      msg = "Invalid password or credentials.";
    } else if (error.code === "auth/user-not-found") {
      msg = "No account found with these credentials.";
    } else if (error.code === "auth/too-many-requests") {
      msg = "Too many failed attempts. Please try again later.";
    } else if (error.code === "auth/network-request-failed") {
      msg = "Network connection failed. Please check your internet connection.";
    }
    return { success: false, errorMessage: msg };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.error("Firebase signout error:", e);
  }
  useAuthStore.getState().logout();
}

// Restore session listener
export function initAuthListener() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile && profile.status === "active") {
        useAuthStore.getState().setUser(profile);
      } else {
        useAuthStore.getState().setUser(null);
      }
    } else {
      useAuthStore.getState().setUser(null);
    }
  });
}

// Send Password Reset Email via Firebase Auth
export async function sendPasswordReset(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: "Password reset link sent to your email address." };
  } catch (error: any) {
    console.error("Password reset error:", error);
    let msg = "Failed to send reset email. Please verify the email address.";
    if (error.code === "auth/user-not-found") {
      msg = "No account found with this email address.";
    } else if (error.code === "auth/invalid-email") {
      msg = "Invalid email format.";
    }
    return { success: false, message: msg };
  }
}

