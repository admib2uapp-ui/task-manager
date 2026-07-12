import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** hide the wordmark, show only the mark */
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="bg-primary text-primary-foreground shadow-glow relative grid size-8 shrink-0 place-items-center rounded-xl">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-4.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity="0.9"
          />
        </svg>
      </div>
      {!iconOnly && (
        <span className="text-[15px] font-semibold tracking-tight">Orbit</span>
      )}
    </div>
  );
}
