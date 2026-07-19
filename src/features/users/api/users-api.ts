import { api } from "@/lib/api-client";
import type { User } from "@/types/domain";

export const usersApi = {
  list: () => api.get<User[]>("/users"),
  updateRole: (userId: string, role: string) =>
    api.patch<{ success: boolean }>(`/users/${userId}`, { role }),
};
