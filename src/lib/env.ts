/**
 * Centralised, validated access to public environment variables.
 * Only `NEXT_PUBLIC_*` values are available in the browser.
 */

function normalizeBaseUrl(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "/") return "";
  return trimmed.replace(/\/$/, "");
}

export const env = {
  // Leave NEXT_PUBLIC_API_URL empty to use same-origin Next.js route handlers.
  apiBaseUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  apiVersion: "v1",
} as const;

/** REST base path, e.g. /api/v1 or https://api.example.com/api/v1 */
export const API_URL = env.apiBaseUrl
  ? `${env.apiBaseUrl}/api/${env.apiVersion}`
  : `/api/${env.apiVersion}`;
