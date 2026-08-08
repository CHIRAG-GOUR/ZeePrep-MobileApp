import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const USER_STORAGE_KEY = "zeeprep_mobile_user_session";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => {
    if (user) {
      SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user)).catch(console.error);
    } else {
      SecureStore.deleteItemAsync(USER_STORAGE_KEY).catch(console.error);
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },
  logout: () => {
    SecureStore.deleteItemAsync(USER_STORAGE_KEY).catch(console.error);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));

// Load persisted user session on startup
SecureStore.getItemAsync(USER_STORAGE_KEY)
  .then((stored) => {
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        useAuthStore.setState({ user: parsed, isAuthenticated: true, isLoading: false });
      } catch {
        useAuthStore.setState({ isLoading: false });
      }
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  })
  .catch(() => useAuthStore.setState({ isLoading: false }));
