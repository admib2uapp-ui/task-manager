"use client";

import { GitBranch, GitPullRequest, ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrbitGithubBadgeProps {
  repoName?: string;
  branch?: string;
  prStatus?: "open" | "merged" | "closed";
  ciStatus?: "passing" | "failing" | "pending";
  commitMessage?: string;
  className?: string;
  compact?: boolean;
}

const PR_STATUS_CONFIG = {
  open: { label: "Open", color: "#22c55e", bgOpacity: "16%" },
  merged: { label: "Merged", color: "#a855f7", bgOpacity: "16%" },
  closed: { label: "Closed", color: "#ef4444", bgOpacity: "16%" },
};

const CI_STATUS_CONFIG = {
  passing: { icon: CheckCircle2, color: "#22c55e" },
  failing: { icon: XCircle, color: "#ef4444" },
  pending: { icon: Clock, color: "#f59e0b" },
};

export function OrbitGithubBadge({
  repoName,
  branch,
  prStatus,
  ciStatus,
  commitMessage,
  className,
  compact = false,
}: OrbitGithubBadgeProps) {
  if (!repoName && !branch && !prStatus) return null;

  return (
    <div
      className={cn(
        "orbit-card-glass inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5",
        compact && "gap-1 px-2 py-1",
        className,
      )}
    >
      {/* Repo icon */}
      <GitBranch className="size-3 shrink-0 text-muted-foreground sm:size-3.5" />

      {/* Repo name */}
      {repoName && (
        <span className={cn("truncate font-medium text-muted-foreground", compact ? "text-[9px]" : "text-[10px] sm:text-xs")}>
          {repoName}
        </span>
      )}

      {/* Branch */}
      {branch && (
        <span className={cn("rounded-md bg-muted/50 px-1.5 py-0.5 font-mono", compact ? "text-[8px]" : "text-[9px] sm:text-[10px]")}>
          {branch}
        </span>
      )}

      {/* PR Status */}
      {prStatus && (
        <span
          className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium", compact ? "text-[8px]" : "text-[9px] sm:text-[10px]")}
          style={{
            backgroundColor: `color-mix(in srgb, ${PR_STATUS_CONFIG[prStatus].color} ${PR_STATUS_CONFIG[prStatus].bgOpacity}, transparent)`,
            color: PR_STATUS_CONFIG[prStatus].color,
          }}
        >
          <GitPullRequest className="size-2.5 sm:size-3" />
          {!compact && PR_STATUS_CONFIG[prStatus].label}
        </span>
      )}

      {/* CI Status */}
      {ciStatus && !compact && (
        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px]" style={{ color: CI_STATUS_CONFIG[ciStatus].color }}>
          {(() => {
            const Icon = CI_STATUS_CONFIG[ciStatus].icon;
            return <Icon className="size-2.5 sm:size-3" />;
          })()}
          {ciStatus}
        </span>
      )}

      {/* Commit message */}
      {commitMessage && !compact && (
        <span className="text-muted-foreground max-w-[120px] truncate text-[9px] sm:text-[10px]">
          {commitMessage}
        </span>
      )}

      {/* External link icon */}
      {(repoName || branch) && (
        <ExternalLink className="size-2.5 shrink-0 text-muted-foreground/50 sm:size-3" />
      )}
    </div>
  );
}
