"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { createClient } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api-client";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { getAuthSession } from "@/features/auth/lib/auth-session";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const supabaseToken = Boolean(data.session?.access_token);
      const localToken = Boolean(getAuthSession()?.accessToken);
      setHasSession(supabaseToken || localToken);
    });
  }, []);

  const { data, error, isError, isLoading } = useCurrentUser(hasSession === true);

  useEffect(() => {
    if (mounted && hasSession === false) {
      reset();
      router.replace("/login");
    }
  }, [mounted, hasSession, reset, router]);

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError) {
      setHasSession(false);
      reset();
      router.replace("/login");
    }
  }, [error, isError, reset, router]);

  if (!mounted || hasSession === null || isLoading || !user) {
    return <FullScreenLoader label="Preparing your workspace…" />;
  }

  return <>{children}</>;
}
