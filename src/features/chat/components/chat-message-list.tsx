"use client";

import { useRef, useCallback, type UIEvent } from "react";
import { Loader2 } from "lucide-react";
import { ChatMessage } from "@/features/chat/components/chat-message";
import type { ChatMessage as ChatMessageType } from "@/types/domain";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  pins: Array<{ id: string; messageId: string; message?: ChatMessageType | null }>;
  hasMore: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  currentUserId: string;
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

export function ChatMessageList({
  messages,
  pins,
  hasMore,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  currentUserId,
  canModerate,
  projectId,
  onReply,
  onDelete,
  onEdit,
  onReact,
  onPin,
  onOpenThread,
  onCopy,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const pinnedIds = new Set(pins.map((p) => p.messageId));

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      if (target.scrollTop < 100 && hasMore && !isFetchingNextPage) {
        onLoadMore();
      }
    },
    [hasMore, isFetchingNextPage, onLoadMore],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="flex-1 space-y-1 overflow-y-auto py-4"
      onScroll={handleScroll}
    >
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        </div>
      )}

      {[...messages].reverse().map((message) => (
        <div key={message.id} className="relative">
          <ChatMessage
            message={message}
            isOwn={message.userId === currentUserId}
            isPinned={pinnedIds.has(message.id)}
            canModerate={canModerate}
            projectId={projectId}
            onReply={onReply}
            onDelete={onDelete}
            onEdit={onEdit}
            onReact={onReact}
            onPin={onPin}
            onOpenThread={onOpenThread}
            onCopy={onCopy}
          />
        </div>
      ))}
    </div>
  );
}
