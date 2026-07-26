"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChatUIStore } from "@/features/chat/stores/chat-ui-store";
import { useSendMessage } from "@/features/chat/hooks/use-chat-mutations";
import { getInitials } from "@/lib/format";
import { formatDate } from "@/lib/format";

      interface ThreadMessage {
  id: string;
  body: string;
  userId: string;
  user?: { id: string; name: string } | null;
  createdAt: string;
}

interface ChatThreadProps {
  projectId: string;
}

export function ChatThread({ projectId }: ChatThreadProps) {
  const { activeThread, setActiveThread } = useChatUIStore();
  const sendMessage = useSendMessage(projectId);
  const [replyText, setReplyText] = useState("");

  if (!activeThread) return null;

  const threadMessages = activeThread.threadMessages || [];

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    sendMessage.mutate({
      body: replyText.trim(),
      threadId: activeThread.id,
    });
    setReplyText("");
  };

  return (
    <div className="border-border flex h-full w-80 flex-col border-l">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Thread</h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg"
          onClick={() => setActiveThread(null)}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6 rounded-xl bg-muted/50 p-3">
          <div className="flex items-start gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px]">
                {getInitials(activeThread.user?.name ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {activeThread.user?.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDate(activeThread.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {activeThread.body}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {(threadMessages as ThreadMessage[]).map((msg) => (
            <div key={msg.id} className="flex items-start gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-[10px]">
                  {getInitials(msg.user?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {msg.user?.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">
                  {msg.body || ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendReply();
            }
          }}
          placeholder="Reply in thread..."
          className="border-border bg-muted/50 min-h-9 flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background"
        />
        <Button
          size="icon"
          className="size-9 shrink-0 rounded-xl"
          disabled={!replyText.trim() || sendMessage.isPending}
          onClick={handleSendReply}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
