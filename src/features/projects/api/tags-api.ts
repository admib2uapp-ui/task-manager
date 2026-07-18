import { api } from "@/lib/api-client";
import type { Tag } from "@/types/domain";

export interface TagPayload {
  name: string;
  color?: string;
}

export const tagsApi = {
  list: () => api.get<Tag[]>("/tags"),
  create: (payload: TagPayload) => api.post<Tag>("/tags", payload),
};
