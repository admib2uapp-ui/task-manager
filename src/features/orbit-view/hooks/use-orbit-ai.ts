"use client";

import { useCallback } from "react";
import { aiApi } from "@/features/ai-manager/api/ai-api";
import type { AiChatResponse } from "@/features/ai-manager/api/ai-api";

interface OrbitSuggestion {
  type: string;
  summary: string;
  params: Record<string, unknown>;
}

export function useOrbitAi(projectId?: string) {
  const getOrbitSuggestions = useCallback(
    async (context: string): Promise<OrbitSuggestion[]> => {
      if (!projectId) return [];

      try {
        const response: AiChatResponse = await aiApi.sendMessage({
          message: `Analyze the orbit view workspace for project ${projectId} and provide suggestions.\n\nContext: ${context}\n\nSuggest actions like: move idea to development, ready for testing, ready for review, assign reviewer, suggest priority, identify risks.`,
          projectId,
        });

        if (response.type === "chat" && response.summary) {
          return [
            {
              type: "suggestion",
              summary: response.summary,
              params: {},
            },
          ];
        }

        if (response.actions) {
          return response.actions.map((action) => ({
            type: action.type,
            summary: action.type,
            params: action.params,
          }));
        }

        return [];
      } catch {
        return [];
      }
    },
    [projectId],
  );

  return {
    getOrbitSuggestions,
  };
}
