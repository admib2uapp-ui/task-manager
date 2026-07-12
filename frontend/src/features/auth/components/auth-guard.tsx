"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { getAccessToken } from "@/lib/auth-storage";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { useAuthStore } from "@/features/auth/store/auth-store";

/**
 * Client-side route guard for authenticated areas.
 * Validates the stored token against the API and redirects to /login on failure.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);

  useEffect(() => setMounted(true), []);

  const tokenPresent = mounted && Boolean(getAccessToken());
  const { data, isError, isLoading } = useCurrentUser();

  useEffect(() => {
    if (mounted && !tokenPresent) {
      router.replace("/login");
    }
  }, [mounted, tokenPresent, router]);

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError) {
      reset();
      router.replace("/login");
    }
  }, [isError, reset, router]);

  if (!mounted || !tokenPresent || isLoading || !user) {
    return <FullScreenLoader label="Preparing your workspace…" />;
  }

  return <>{children}</>;
}
