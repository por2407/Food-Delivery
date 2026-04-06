import { create } from "zustand";
import { authService } from "../services/auth-service";

interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setUser: (user: any) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (data) => {
    // Normalizing user object from different sources (Login vs Me)
    if (!data) {
      set({ user: null });
      return;
    }

    const user: User = {
      id: data.user_id || data.id || data.info?.id || 0,
      email: data.email || data.info?.email || "",
      name: data.name || data.info?.name || data.email?.split('@')[0] || "User",
      role: data.role || data.info?.role || "user",
    };
    set({ user, initialized: true });
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const data = await authService.getMe();
      // data here is { user_id, email, role } based on backend handlers/auth_handler.go:111
      const normalizedUser: User = {
        id: data.user_id || 0,
        email: data.email || "",
        name: data.name || data.email?.split('@')[0] || "User",
        role: data.role || "user",
      };
      set({ user: normalizedUser, initialized: true });
    } catch (error) {
      set({ user: null, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      set({ user: null });
    } catch (error) {
      console.error("Logout failed", error);
    }
  }
}));
