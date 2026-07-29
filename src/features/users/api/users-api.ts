import { api } from "@/lib/api-client";
import type { User } from "@/types/domain";

export const usersApi = {
  list: () => api.get<User[]>("/users"),
  updateRole: (userId: string, role: string) =>
    api.patch<{ success: boolean }>(`/users/${userId}`, { role }),
  remove: (userId: string) =>
    api.delete<{ success: boolean }>(`/users/${userId}`),
  block: (userId: string) =>
    api.post<{ success: boolean }>(`/users/${userId}/block`),
  unblock: (userId: string) =>
    api.post<{ success: boolean }>(`/users/${userId}/unblock`),
};
