"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const handleSession = useCallback(
    async (next: string) => {
      const supabase = createClient();

      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            setError(sessionError.message);
            return;
          }
          router.replace(next);
          return;
        }
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        router.replace(next);
        return;
      }

      setError("No authorization code received");
    },
    [searchParams, router],
  );

  useEffect(() => {
    const next = searchParams.get("next") ?? "/dashboard";
    handleSession(next);
  }, [searchParams, handleSession]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">
            Authentication failed
          </p>
          <p className="text-muted-foreground mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return <FullScreenLoader label="Completing sign in…" />;
}
