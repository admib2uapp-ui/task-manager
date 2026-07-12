import { create } from "zustand";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth-storage";
import type { User } from "@/types/domain";
import type { AuthResponse, AuthStatus } from "@/features/auth/types";

interface AuthState {
  user: User | null;
  status: AuthStatus;

  /** persist tokens + set the authenticated user after login/register */
  setSession: (response: AuthResponse) => void;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  /** clear everything on logout / hard auth failure */
  reset: () => void;
  /** whether a token exists locally (optimistic, pre-validation) */
  hasToken: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  setSession: (response) => {
    setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    set({ user: response.user, status: "authenticated" });
  },

  setUser: (user) =>
    set({ user, status: user ? "authenticated" : "unauthenticated" }),

  setStatus: (status) => set({ status }),

  reset: () => {
    clearTokens();
    set({ user: null, status: "unauthenticated" });
  },

  hasToken: () => Boolean(getAccessToken()),
}));
