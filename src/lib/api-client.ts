import { API_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { clearAuthSession } from "@/features/auth/lib/auth-session";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!params) return base;

  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function clearAuthAndRedirect(): Promise<void> {
  clearAuthSession();
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore — session may already be gone
  }
  window.location.href = "/login";
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {

  const { body, params, headers, skipAuth, ...init } = options;

  const finalHeaders = new Headers(headers);

  if (typeof window !== "undefined") {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, params), {
    ...init,
    method,
    headers: finalHeaders,
    credentials: "include",
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    if (response.status === 401 && !skipAuth && typeof window !== "undefined") {
      await clearAuthAndRedirect();
    }

    const detail =
      (payload && typeof payload === "object" && "detail" in payload
        ? (payload as { detail: unknown }).detail
        : payload) ?? response.statusText;
    const message = typeof detail === "string" ? detail : "Request failed";
    throw new ApiError(response.status, message, undefined, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
