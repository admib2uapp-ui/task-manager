"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { getAccessToken } from "@/lib/auth-storage";

/**
 * Wraps public auth pages. If a token already exists, send the user to the app.
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const tokenPresent = mounted && Boolean(getAccessToken());

  useEffect(() => {
    if (tokenPresent) router.replace("/dashboard");
  }, [tokenPresent, router]);

  if (!mounted) return <FullScreenLoader />;
  if (tokenPresent) return <FullScreenLoader label="Redirecting…" />;

  return <>{children}</>;
}
