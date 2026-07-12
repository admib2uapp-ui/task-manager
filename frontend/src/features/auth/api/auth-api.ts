import { api } from "@/lib/api-client";
import type { User } from "@/types/domain";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "@/features/auth/types";

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload, { skipAuth: true }),

  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", payload, { skipAuth: true }),

  me: () => api.get<User>("/auth/me"),

  updateProfile: (payload: { name?: string; avatarUrl?: string | null }) =>
    api.patch<User>("/auth/me", payload),

  logout: () => api.post<void>("/auth/logout"),
};
