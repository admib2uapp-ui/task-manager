import { api } from "@/lib/api-client";
import type { User } from "@/types/domain";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }, { skipAuth: true }),

  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>("/auth/register", { name, email, password }, { skipAuth: true }),

  syncUser: () => api.post<User>("/auth/sync"),

  getUser: () => api.get<User>("/auth/me"),

  updateProfile: (payload: { name?: string; avatarUrl?: string | null }) =>
    api.patch<User>("/auth/me", payload),
};
