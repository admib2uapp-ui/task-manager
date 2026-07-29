import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry } from "./retry";

const TIMEOUT_MS = 15000;
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const FALLBACK_GEMINI_MODEL = "gemini-pro-latest";

const modelClient = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY ?? "",
);

function parseJsonResponse(text: string): unknown {
  const cleaned = text
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error("Invalid JSON response from AI");
      }
    }
    throw new Error("Invalid JSON response from AI");
  }
}

function isModelUnavailableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as Record<string, unknown>;
  const status = typeof err.status === "number" ? err.status : 0;
  const message = err.message ? String(err.message).toLowerCase() : "";
  return (
    status === 404 ||
    message.includes("not found") ||
    message.includes("not available") ||
    message.includes("not supported") ||
    (message.includes("model") && message.includes("not"))
  );
}

export interface GeminiResponse {
  intent: string;
  actions: Array<{ type: string; params: Record<string, unknown> }>;
  requiresConfirmation: boolean;
  summary: string;
}

async function callGeminiWithModel(
  modelName: string,
  systemPrompt: string,
  userMessage: string,
  contextJson: string,
): Promise<GeminiResponse> {
  const model = modelClient.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
    },
  });

  const result = await withRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
            {
              role: "user",
              parts: [
                {
                  text: `## Current Context\n\n${contextJson}\n\n## User Request\n\n${userMessage}\n\nRespond with the JSON format specified in the system prompt.`,
                },
              ],
            },
          ],
        });

        const text = response.response.text();
        return parseJsonResponse(text) as GeminiResponse;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      maxAttempts: 3,
      baseDelayMs: 1000,
      onRetry: (attempt, error) => {
        console.warn(`Gemini API retry ${attempt}:`, error);
      },
    },
  );

  if (!result || typeof result !== "object") {
    throw new Error("Invalid response structure from AI");
  }

  const record = result as unknown as Record<string, unknown>;

  return {
    intent: String(record.intent ?? "GENERAL_CHAT"),
    actions: Array.isArray(record.actions)
      ? (record.actions as Array<{
          type: string;
          params: Record<string, unknown>;
        }>)
      : [],
    requiresConfirmation: Boolean(record.requiresConfirmation),
    summary: String(record.summary ?? ""),
  };
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  contextJson: string,
): Promise<GeminiResponse> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      intent: "GENERAL_CHAT",
      actions: [],
      requiresConfirmation: false,
      summary:
        "AI is not configured. Please set the GEMINI_API_KEY environment variable.",
    };
  }

  const configuredModel = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;

  try {
    return await callGeminiWithModel(
      configuredModel,
      systemPrompt,
      userMessage,
      contextJson,
    );
  } catch (error) {
    if (
      configuredModel !== FALLBACK_GEMINI_MODEL &&
      isModelUnavailableError(error)
    ) {
      console.warn(
        `Gemini model "${configuredModel}" unavailable, falling back to "${FALLBACK_GEMINI_MODEL}"`,
      );
      return await callGeminiWithModel(
        FALLBACK_GEMINI_MODEL,
        systemPrompt,
        userMessage,
        contextJson,
      );
    }
    throw error;
  }
}
