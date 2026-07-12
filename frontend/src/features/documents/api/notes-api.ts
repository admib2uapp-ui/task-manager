import { api } from "@/lib/api-client";

export interface NoteSummary {
  id: string;
  projectId: string | null;
  title: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  workspaceId: string;
  projectId: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteUpdatePayload {
  title?: string;
  content?: string;
  projectId?: string | null;
}

export const notesApi = {
  list: () => api.get<NoteSummary[]>("/notes"),
  get: (id: string) => api.get<Note>(`/notes/${id}`),
  create: (title = "Untitled") => api.post<Note>("/notes", { title }),
  update: (id: string, payload: NoteUpdatePayload) =>
    api.patch<Note>(`/notes/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/notes/${id}`),
};
