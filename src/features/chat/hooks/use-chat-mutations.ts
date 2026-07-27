"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/features/chat/api/chat-api";
import { chatQueryKeys } from "@/features/chat/hooks/use-chat-messages";
import { toast } from "sonner";

export function useSendMessage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof chatApi.sendMessage>[1]) =>
      chatApi.sendMessage(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(projectId),
      });
    },
    onError: () => toast.error("Could not send message"),
  });
}

export function useEditMessage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      chatApi.editMessage(projectId, messageId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(projectId),
      });
    },
    onError: () => toast.error("Could not edit message"),
  });
}

export function useDeleteMessage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(projectId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(projectId),
      });
    },
    onError: () => toast.error("Could not delete message"),
  });
}

export function useToggleReaction(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => chatApi.toggleReaction(projectId, messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(projectId),
      });
    },
  });
}

export function usePinMessage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => chatApi.pinMessage(projectId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(projectId),
      });
    },
    onError: () => toast.error("Could not pin message"),
  });
}

export function useUnpinMessage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => chatApi.unpinMessage(projectId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(projectId),
      });
    },
    onError: () => toast.error("Could not unpin message"),
  });
}

export function useUploadFile(projectId: string) {
  return useMutation({
    mutationFn: ({
      file,
      messageId,
    }: {
      file: File;
      messageId?: string;
    }) => chatApi.uploadFile(projectId, file, messageId),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Could not upload file";
      toast.error(message);
      console.error("Upload failed:", error);
    },
  });
}
