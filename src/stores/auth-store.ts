import { create } from "zustand";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { User, UserRole } from "../types";

export type ViewMode = "superadmin" | "admin" | "teacher" | "student";

interface AuthState {
  user: User | null;
  viewMode: ViewMode | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setViewMode: (mode: ViewMode) => void;
  logout: () => void;
}

const USER_STORAGE_KEY = "zeeprep_mobile_user_session";
const VIEW_MODE_STORAGE_KEY = "zeeprep_mobile_view_mode";

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error("LocalStorage set error:", e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("LocalStorage remove error:", e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function isSuperAdminUser(user: User | null): boolean {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  const email = (user.email || "").toLowerCase();
  return (
    email === "pa1@skillizee.io" ||
    email === "tech@skillizee.io" ||
    email === "superadmin@zeeprep.com"
  );
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  viewMode: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => {
    if (user) {
      setItem(USER_STORAGE_KEY, JSON.stringify(user)).catch(console.error);
      const isSuper = isSuperAdminUser(user);
      const defaultView: ViewMode = isSuper ? "superadmin" : (user.role as ViewMode) || "student";
      set({ user, viewMode: defaultView, isAuthenticated: true, isLoading: false });
    } else {
      deleteItem(USER_STORAGE_KEY).catch(console.error);
      deleteItem(VIEW_MODE_STORAGE_KEY).catch(console.error);
      set({ user: null, viewMode: null, isAuthenticated: false, isLoading: false });
    }
  },
  setViewMode: (mode) => {
    const user = get().user;
    if (isSuperAdminUser(user)) {
      setItem(VIEW_MODE_STORAGE_KEY, mode).catch(console.error);
      set({ viewMode: mode });
    }
  },
  logout: () => {
    deleteItem(USER_STORAGE_KEY).catch(console.error);
    deleteItem(VIEW_MODE_STORAGE_KEY).catch(console.error);
    set({ user: null, viewMode: null, isAuthenticated: false, isLoading: false });
  },
}));

// Load persisted user session on startup with safety timeout
const initStoreSession = async () => {
  try {
    const [storedUser, storedViewMode] = await Promise.race([
      Promise.all([getItem(USER_STORAGE_KEY), getItem(VIEW_MODE_STORAGE_KEY)]),
      new Promise<[string | null, string | null]>((resolve) =>
        setTimeout(() => resolve([null, null]), 2000)
      ),
    ]);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const isSuper = isSuperAdminUser(parsedUser);
        const viewMode = (isSuper && storedViewMode ? storedViewMode : isSuper ? "superadmin" : parsedUser.role) as ViewMode;

        useAuthStore.setState({
          user: parsedUser,
          viewMode,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      } catch {
        // Fall through
      }
    }
  } catch {
    // Fall through
  }
  useAuthStore.setState({ isLoading: false });
};

initStoreSession();
