"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthSession } from "@/features/auth/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data } = await createClient().auth.getSession();
      if (data.session?.access_token || getAuthSession()?.accessToken) {
        router.replace("/dashboard");
      }
    };
    check();
  }, [router]);

  return (
    <div className="bg-background relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.15]"
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="mb-6">
          <Logo />
        </div>
        <h1 className="text-foreground mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Orbit
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          Project management platform for modern teams. Plan, track, and
          deliver.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-xl px-8 text-base"
          >
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
