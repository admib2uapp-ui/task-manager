"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { createClient } from "@/lib/supabase/client";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          window.location.replace("/dashboard");
        } else {
          router.replace("/login?error=oauth");
        }
      })
      .catch(() => {
        router.replace("/login?error=oauth");
      });
  }, [router]);

  return <FullScreenLoader label="Signing you in…" />;
}
