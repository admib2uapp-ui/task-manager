"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type DragEvent,
} from "react";
import {
  Send,
  Paperclip,
  X,
  MessageSquareQuote,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/features/chat/components/emoji-picker";
import { MentionList } from "@/features/chat/components/mention-list";
import { useChatUIStore } from "@/features/chat/stores/chat-ui-store";
import type { User } from "@/types/domain";


interface ChatInputProps {
  onSend: (body: string, mentionIds: string[]) => void;
  onEdit: (messageId: string, body: string) => void;
  onUpload: (files: FileList) => void;
  isSending: boolean;
  projectMembers: User[];
  broadcastTyping: () => void;
}

export function ChatInput({
  onSend,
  onEdit,
  onUpload,
  isSending,
  projectMembers,
  broadcastTyping,
}: ChatInputProps) {
  const { replyingTo, editingMessage, setReplyingTo, setEditingMessage } =
    useChatUIStore();
  const [text, setText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.body);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const filteredMembers = projectMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(mentionSearch.toLowerCase()),
  );

  const handleChange = useCallback(
    (value: string) => {
      setText(value);
      broadcastTyping();

      const lastAt = value.lastIndexOf("@");
      if (lastAt !== -1 && (lastAt === 0 || value[lastAt - 1] === " ")) {
        const search = value.slice(lastAt + 1);
        if (!search.includes(" ")) {
          setShowMentions(true);
          setMentionSearch(search);
          setMentionIndex(0);
          return;
        }
      }
      setShowMentions(false);
    },
    [broadcastTyping],
  );

  const insertMention = useCallback(
    (user: User) => {
      const lastAt = text.lastIndexOf("@");
      const before = text.slice(0, lastAt);
      const after = text.slice(lastAt + mentionSearch.length + 1);
      setText(`${before}@${user.name} ${after}`);
      setShowMentions(false);
      textareaRef.current?.focus();
    },
    [text, mentionSearch],
  );

  const handleSend = useCallback(() => {
    if (!text.trim() || isSending) return;

    if (editingMessage) {
      onEdit(editingMessage.id, text.trim());
      setEditingMessage(null);
    } else {
      const mentionIds = projectMembers
        .filter((m) => text.includes(`@${m.name}`))
        .map((m) => m.id);
      onSend(text.trim(), mentionIds);
    }
    setText("");
    setReplyingTo(null);
  }, [
    text,
    isSending,
    editingMessage,
    onSend,
    onEdit,
    setEditingMessage,
    projectMembers,
    setReplyingTo,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showMentions) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" && filteredMembers[mentionIndex]) {
          e.preventDefault();
          insertMention(filteredMembers[mentionIndex]);
          return;
        }
        if (e.key === "Escape") {
          setShowMentions(false);
          return;
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [showMentions, mentionIndex, filteredMembers, insertMention, handleSend],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files);
      }
    },
    [onUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onUpload(e.target.files);
        e.target.value = "";
      }
    },
    [onUpload],
  );

  return (
    <div
      className={`border-border relative border-t px-4 pb-4 pt-3 transition-colors ${
        isDragOver ? "bg-primary/5 border-primary" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium">
          Drop files to upload
        </div>
      )}

      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <MessageSquareQuote className="text-muted-foreground size-3.5 shrink-0" />
          <span className="text-muted-foreground flex-1 truncate">
            Replying to <span className="font-medium">{replyingTo.user?.name}</span>
          </span>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <Pencil className="text-muted-foreground size-3.5 shrink-0" />
          <span className="text-muted-foreground flex-1">Editing message</span>
          <button
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setText("");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2">
        <div className="relative flex-1">
          {showMentions && filteredMembers.length > 0 && (
            <MentionList
              users={filteredMembers}
              onSelect={insertMention}
              highlightIndex={mentionIndex}
            />
          )}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            rows={1}
            className="border-border bg-muted/50 placeholder:text-muted-foreground/60 min-h-[44px] w-full resize-none rounded-xl border px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background"
          />
          <div className="absolute bottom-1.5 right-1.5">
            <EmojiPicker
              onSelect={(emoji) => {
                const start = textareaRef.current?.selectionStart ?? text.length;
                setText(text.slice(0, start) + emoji + text.slice(start));
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="file"
            id="chat-file-upload"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.mp4,.mov,.txt,.json,.js,.ts,.py,.java,.cpp,.css,.html"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            onClick={() =>
              document.getElementById("chat-file-upload")?.click()
            }
            aria-label="Upload file"
          >
            <Paperclip className="size-4" />
          </Button>

          <Button
            size="icon"
            className="size-9 shrink-0 rounded-xl"
            disabled={!text.trim() || isSending}
            onClick={handleSend}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
