"use client";

import { Bot, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiMessage } from "../api/ai-api";
import { AiActionCard } from "./ai-action-card";

interface AiChatMessageProps {
  message: AiMessage;
  onConfirm?: (messageId: string) => void;
  onCancel?: (messageId: string) => void;
  isConfirming?: boolean;
}

export function AiChatMessage({
  message,
  onConfirm,
  onCancel,
  isConfirming,
}: AiChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isPending = message.status === "pending";
  const isFailed = message.status === "failed";
  const isRejected = message.status === "rejected";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div
          className={cn(
            "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full",
            isSystem
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          {isSystem ? (
            <AlertCircle className="size-4" />
          ) : (
            <Bot className="size-4" />
          )}
        </div>
      )}

      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : isSystem
                ? "bg-destructive/5 text-destructive border border-destructive/20 rounded-bl-md"
                : "bg-muted/50 text-foreground border border-border/50 rounded-bl-md",
            isPending && "border-amber-500/30 bg-amber-500/5",
            isRejected && "border-muted bg-muted/20 text-muted-foreground",
          )}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {message.content.split("\n").map((line, i) => (
              <p key={i} className={cn(i > 0 && "mt-1")}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {isPending && message.actionPlan && onConfirm && onCancel && (
          <AiActionCard
            messageId={message.id}
            actionPlan={message.actionPlan as Record<string, unknown>}
            onConfirm={onConfirm}
            onCancel={onCancel}
            isConfirming={isConfirming}
          />
        )}

        {isFailed && message.error && (
          <p className="text-destructive px-1 text-xs">{message.error}</p>
        )}
      </div>

      {isUser && (
        <div className="bg-muted mt-1 flex size-8 shrink-0 items-center justify-center rounded-full">
          <User className="text-muted-foreground size-4" />
        </div>
      )}
    </div>
  );
}
