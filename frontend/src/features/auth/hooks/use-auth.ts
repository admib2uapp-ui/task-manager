"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { User } from "@/types/domain";

function toDomainUser(user: {
  id: string;
  email?: string;
  user_metadata?: { name?: string };
  created_at?: string;
  updated_at?: string;
}): User {
  return {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.name as string) ?? user.email?.split("@")[0] ?? "",
    avatarUrl: null,
    createdAt: user.created_at ?? new Date().toISOString(),
    updatedAt: user.updated_at ?? new Date().toISOString(),
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await authApi.getUser();
      if (!user) throw new Error("No session");
      return toDomainUser(user);
    },
    enabled: typeof window !== "undefined",
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(toDomainUser(session.user));
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      } else if (event === "SIGNED_OUT") {
        reset();
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, reset, queryClient]);
}

function useAuthSuccess() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return (user: unknown) => {
    const u = user as Parameters<typeof toDomainUser>[0];
    setUser(toDomainUser(u));
    queryClient.setQueryData(queryKeys.auth.me, toDomainUser(u));
    router.replace("/dashboard");
  };
}

export function useLogin() {
  const onSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.signIn(email, password),
    onSuccess: (data) => {
      if (data.data.user) onSuccess(data.data.user);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to sign in. Please try again.";
      toast.error(message);
    },
  });
}

export function useRegister() {
  const onSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => authApi.signUp(email, password, name),
    onSuccess: (data) => {
      if (data.data.user) {
        // With email confirmations off, user is signed in immediately
        if (data.data.session) {
          onSuccess(data.data.user);
        } else {
          toast.success("Check your email for the confirmation link.");
        }
      }
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to create your account. Please try again.";
      toast.error(message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reset = useAuthStore((s) => s.reset);

  return useMutation({
    mutationFn: () => authApi.signOut(),
    onSettled: () => {
      reset();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
