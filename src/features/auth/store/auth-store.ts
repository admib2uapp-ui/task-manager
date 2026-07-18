import { create } from "zustand";
import type { User } from "@/types/domain";
import type { AuthStatus } from "@/features/auth/types";

interface AuthState {
  user: User | null;
  status: AuthStatus;

  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  setUser: (user) =>
    set({ user, status: user ? "authenticated" : "unauthenticated" }),

  setStatus: (status) => set({ status }),

  reset: () => set({ user: null, status: "unauthenticated" }),
}));
