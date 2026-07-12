import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** remove default max-width for full-bleed boards (Kanban) */
  fluid?: boolean;
}

export function PageContainer({
  children,
  className,
  fluid = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8",
        !fluid && "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
