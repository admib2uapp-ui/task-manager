"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { createClient } from "@/lib/supabase/client";

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session?.access_token));
    });
  }, []);

  useEffect(() => {
    if (hasSession) router.replace("/dashboard");
  }, [hasSession, router]);

  if (!mounted || hasSession === null) return <FullScreenLoader />;
  if (hasSession) return <FullScreenLoader label="Redirecting…" />;

  return <>{children}</>;
}
