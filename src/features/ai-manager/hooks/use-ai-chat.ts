"use client";

import { useCallback, useRef, useState } from "react";
import { aiApi, type AiMessage } from "../api/ai-api";

export interface ChatState {
  messages: AiMessage[];
  conversationId: string | null;
  isProcessing: boolean;
  pendingMessageId: string | null;
  error: string | null;
}

export function useAiChat(projectId?: string) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    conversationId: null,
    isProcessing: false,
    pendingMessageId: null,
    error: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || stateRef.current.isProcessing) return;

      const userMsg: AiMessage = {
        id: `temp-${Date.now()}`,
        conversationId: stateRef.current.conversationId ?? "",
        role: "user",
        content: message,
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMsg],
        isProcessing: true,
        error: null,
      }));

      try {
        const response = await aiApi.sendMessage({
          message,
          conversationId: stateRef.current.conversationId ?? undefined,
          projectId,
        });

        const assistantMsg: AiMessage = {
          id: `ai-${Date.now()}`,
          conversationId: response.conversationId,
          role: "assistant",
          content: response.summary,
          status:
            response.type === "confirmation"
              ? "pending"
              : response.type === "error"
                ? "failed"
                : "completed",
          actionPlan:
            response.type === "confirmation"
              ? { actions: response.actions }
              : null,
          createdAt: new Date().toISOString(),
        };

        setState((prev) => {
          const updatedMessages = [...prev.messages, assistantMsg];
          const userMsgIndex = updatedMessages.findIndex(
            (m) => m.id === userMsg.id,
          );
          if (userMsgIndex >= 0) {
            updatedMessages[userMsgIndex] = {
              ...updatedMessages[userMsgIndex],
              conversationId: response.conversationId,
            };
          }

          return {
            ...prev,
            messages: updatedMessages,
            conversationId: response.conversationId,
            isProcessing: false,
            pendingMessageId:
              response.type === "confirmation" ? assistantMsg.id : null,
            error: response.type === "error" ? response.summary : null,
          };
        });

        return response;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to send message";

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMsg,
          messages: [
            ...prev.messages,
            {
              id: `err-${Date.now()}`,
              conversationId: prev.conversationId ?? "",
              role: "system",
              content: `Error: ${errorMsg}`,
              status: "failed",
              createdAt: new Date().toISOString(),
            },
          ],
        }));

        return null;
      }
    },
    [projectId],
  );

  const confirmAction = useCallback(async (messageId: string) => {
    try {
      const response = await aiApi.confirmActions(messageId);

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === messageId
            ? { ...m, status: "executed", content: response.summary }
            : m,
        ),
        pendingMessageId: null,
      }));

      return response;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to confirm action";
      setState((prev) => ({ ...prev, error: errorMsg }));
      return null;
    }
  }, []);

  const cancelAction = useCallback(async (messageId: string) => {
    try {
      const response = await aiApi.cancelActions(messageId);

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === messageId
            ? { ...m, status: "rejected", content: response.summary }
            : m,
        ),
        pendingMessageId: null,
      }));

      return response;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to cancel action";
      setState((prev) => ({ ...prev, error: errorMsg }));
      return null;
    }
  }, []);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      conversationId: null,
      isProcessing: false,
      pendingMessageId: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    sendMessage,
    confirmAction,
    cancelAction,
    clearChat,
  };
}
