import { Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="bg-background flex h-dvh w-full flex-col items-center justify-center gap-4">
      <Logo />
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {label ?? "Loading…"}
      </div>
    </div>
  );
}
