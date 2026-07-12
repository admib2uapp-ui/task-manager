"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-storage";
import { queryKeys } from "@/lib/query-keys";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "@/features/auth/types";

/** Fetches the current user; enabled only when a token is present. */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.me,
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

function useAuthSuccess() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return (response: AuthResponse) => {
    setSession(response);
    queryClient.setQueryData(queryKeys.auth.me, response.user);
    router.replace("/dashboard");
  };
}

export function useLogin() {
  const onSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess,
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sign in. Please try again.";
      toast.error(message);
    },
  });
}

export function useRegister() {
  const onSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess,
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to create your account. Please try again.";
      toast.error(message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reset = useAuthStore((s) => s.reset);

  return useMutation({
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSettled: () => {
      reset();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
