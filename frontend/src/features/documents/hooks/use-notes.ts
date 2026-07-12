"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  notesApi,
  type NoteUpdatePayload,
} from "@/features/documents/api/notes-api";

const keys = {
  list: ["notes", "list"] as const,
  detail: (id: string) => ["notes", "detail", id] as const,
};

export function useNotes() {
  return useQuery({ queryKey: keys.list, queryFn: notesApi.list });
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: keys.detail(id ?? ""),
    queryFn: () => notesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notesApi.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NoteUpdatePayload }) =>
      notesApi.update(id, payload),
    onSuccess: (note) => {
      queryClient.setQueryData?.(keys.detail(note.id), note);
      queryClient.invalidateQueries({ queryKey: keys.list });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list });
      toast.success("Note deleted");
    },
  });
}
