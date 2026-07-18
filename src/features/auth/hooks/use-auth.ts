"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/store/auth-store";
export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.getUser,
    enabled: enabled && typeof window !== "undefined",
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useAuthListener() {
  const supabaseRef = useRef(createClient());
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseRef.current;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      } else if (event === "SIGNED_OUT") {
        reset();
        queryClient.clear();
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, setUser, reset, router]);
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const user = await authApi.getUser();
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
      router.replace("/dashboard");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.";
      toast.error(message);
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      const user = await authApi.getUser();
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
      router.replace("/dashboard");
    },
    onError: (error) => {
      const message =
        error instanceof Error
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
    mutationFn: async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
    },
    onSettled: () => {
      reset();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
