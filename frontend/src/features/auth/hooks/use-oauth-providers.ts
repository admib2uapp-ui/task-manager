"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/auth-api";

export function useOAuthProviders() {
  return useQuery({
    queryKey: ["auth", "oauth-providers"],
    queryFn: authApi.oauthProviders,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
