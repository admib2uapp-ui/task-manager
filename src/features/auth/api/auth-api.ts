import { api } from "@/lib/api-client";
import type { User } from "@/types/domain";

export const authApi = {
  getUser: () => api.get<User>("/auth/me"),

  updateProfile: (payload: { name?: string; avatarUrl?: string | null }) =>
    api.patch<User>("/auth/me", payload),
};
