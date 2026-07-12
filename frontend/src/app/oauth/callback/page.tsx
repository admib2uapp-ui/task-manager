"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";
import { setTokens } from "@/lib/auth-storage";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken });
      window.location.replace("/dashboard");
    } else {
      router.replace("/login?error=oauth");
    }
  }, [router]);

  return <FullScreenLoader label="Signing you in…" />;
}
