"use client";

import {
  MoreHorizontal,
  Reply,
  MessageSquare,
  Pin,
  Copy,
  Trash2,
  Pencil,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/features/chat/components/emoji-picker";
import { FilePreview } from "@/features/chat/components/file-preview";
import type { ChatMessage as ChatMessageType } from "@/types/domain";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
  isPinned?: boolean;
  canModerate: boolean;
  projectId: string;
  onReply: (message: ChatMessageType) => void;
  onDelete: (messageId: string) => void;
  onEdit: (message: ChatMessageType) => void;
  onReact: (messageId: string, emoji: string) => void;
  onPin: (messageId: string) => void;
  onOpenThread: (message: ChatMessageType) => void;
  onCopy: (body: string) => void;
}

export function ChatMessage({
  message,
  isOwn,
  isPinned,
  canModerate,
  projectId,
  onReply,
  onDelete,
  onEdit,
  onReact,
  onPin,
  onOpenThread,
  onCopy,
}: ChatMessageProps) {
  const groupedReactions = (message.reactions || []).reduce<
    Record<string, { emoji: string; count: number; hasReacted: boolean }>
  >((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false };
    }
    acc[r.emoji].count++;
    if (r.userId === message.userId) acc[r.emoji].hasReacted = true;
    return acc;
  }, {});

  return (
    <div className="group relative flex gap-3 px-4 py-2 transition-colors hover:bg-muted/30">
      <Avatar className="mt-0.5 size-9 shrink-0">
        <AvatarFallback className="bg-primary/15 text-primary text-xs">
          {getInitials(message.user?.name ?? "?")}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{message.user?.name}</span>
          <span className="text-muted-foreground text-xs">
            {formatDate(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-muted-foreground/50 text-xs">(edited)</span>
          )}
          {isPinned && <Pin className="text-primary/60 size-3" />}
        </div>

        {message.replyTo && (
          <button
            type="button"
            className="bg-muted/50 hover:bg-muted flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors"
            onClick={() => onReply(message.replyTo as ChatMessageType)}
          >
            <Reply className="text-muted-foreground size-3 shrink-0" />
            <span className="text-muted-foreground font-medium">
              {message.replyTo.user?.name}
            </span>
            <span className="text-muted-foreground/60 truncate">
              {message.replyTo.body}
            </span>
          </button>
        )}

        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5",
            isOwn ? "bg-primary/10" : "bg-muted",
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.body}
          </p>
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.attachments.map((att) => (
              <FilePreview key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {Object.values(groupedReactions).map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(message.id, r.emoji)}
                className={cn(
                  "hover:bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
                  r.hasReacted ? "bg-primary/10" : "bg-muted/50",
                )}
              >
                <span>{r.emoji}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-0.5">
          <EmojiPicker
            onSelect={(emoji) => onReact(message.id, emoji)}
            size="sm"
          />
          {message.threadMessages && message.threadMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1 rounded-full px-2 text-xs"
              onClick={() => onOpenThread(message)}
            >
              <MessageSquare className="size-3" />
              {message.threadMessages.length} replies
            </Button>
          )}
        </div>

        <div className="bg-background border-border shadow-soft absolute right-4 top-2 flex items-center gap-0.5 rounded-xl border p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg"
              onClick={() => onReply(message)}
              aria-label="Reply"
            >
              <Reply className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg"
              onClick={() => onCopy(message.body)}
              aria-label="Copy"
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg"
              onClick={() => onPin(message.id)}
              aria-label={isPinned ? "Unpin" : "Pin"}
            >
              <Pin className="size-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg"
                  aria-label="More"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {isOwn && (
                  <DropdownMenuItem onClick={() => onEdit(message)}>
                    <Pencil className="mr-2 size-3.5" /> Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onOpenThread(message)}>
                  <MessageSquare className="mr-2 size-3.5" /> Open thread
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(message.id)}
                >
                  <Trash2 className="mr-2 size-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      </div>
    </div>
  );
}
