import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { GuestGuard } from "@/features/auth/components/guest-guard";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <div className="bg-background relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
        {/* Ambient premium background */}
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

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="border-border bg-card/80 shadow-soft rounded-2xl border p-6 backdrop-blur-xl sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
