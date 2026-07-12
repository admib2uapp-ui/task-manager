/**
 * Centralised, validated access to public environment variables.
 * Only `NEXT_PUBLIC_*` values are available in the browser.
 */

function required(value: string | undefined, fallback: string): string {
  if (value && value.length > 0) return value;
  return fallback;
}

export const env = {
  apiBaseUrl: required(
    process.env.NEXT_PUBLIC_API_URL,
    "http://localhost:8000",
  ).replace(/\/$/, ""),
  apiVersion: "v1",
} as const;

/** Fully-qualified REST base, e.g. http://localhost:8000/api/v1 */
export const API_URL = `${env.apiBaseUrl}/api/${env.apiVersion}`;
