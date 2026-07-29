"use client";

import { AlertTriangle, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiActionCardProps {
  messageId: string;
  actionPlan: Record<string, unknown>;
  onConfirm: (messageId: string) => void;
  onCancel: (messageId: string) => void;
  isConfirming?: boolean;
}

export function AiActionCard({
  messageId,
  actionPlan,
  onConfirm,
  onCancel,
  isConfirming,
}: AiActionCardProps) {
  const actions = (actionPlan?.actions as Array<Record<string, unknown>>) ?? [];
  const hasDangerous = actions.some((a) => a.dangerous);
  const actionCount = actions.length;

  return (
    <div className="border-border/50 mt-2 overflow-hidden rounded-xl border bg-amber-500/5">
      {hasDangerous && (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
            This action requires confirmation
          </span>
        </div>
      )}

      <div className="space-y-1 p-3">
        <p className="text-xs font-medium">
          {actionCount} action{actionCount !== 1 ? "s" : ""} to execute:
        </p>
        {actions.map((action, i) => {
          const isDangerous = action.dangerous as boolean;
          const actionType = action.type as string;
          const params = action.params as Record<string, unknown> ?? {};

          return (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${isDangerous ? "bg-destructive" : "bg-primary"}`}
              />
              <span className="font-medium">{formatActionType(actionType)}</span>
          {String(params.title ?? "") && (
            <span className="truncate">&ldquo;{String(params.title)}&rdquo;</span>
          )}
          {String(params.name ?? "") && (
            <span className="truncate">&ldquo;{String(params.name)}&rdquo;</span>
          )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border/50 px-3 py-2">
        <Button
          size="sm"
          variant="default"
          className="h-7 gap-1 rounded-lg text-xs"
          onClick={() => onConfirm(messageId)}
          disabled={isConfirming}
        >
          {isConfirming ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Check className="size-3" />
          )}
          Confirm
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 rounded-lg text-xs"
          onClick={() => onCancel(messageId)}
          disabled={isConfirming}
        >
          <X className="size-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function formatActionType(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
