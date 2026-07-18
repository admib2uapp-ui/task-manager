import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-card/40 flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-2xl">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
