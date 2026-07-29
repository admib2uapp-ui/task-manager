"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Sparkles,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAiChat } from "@/features/ai-manager/hooks/use-ai-chat";
import { AiChatMessage } from "./ai-chat-message";
import { AiChatInput } from "./ai-chat-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function extractProjectId(pathname: string): string | undefined {
  const match = pathname.match(/\/projects\/([a-f0-9-]{36})/);
  return match?.[1] ?? undefined;
}

export function AiManagerFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const projectId = extractProjectId(pathname);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isProcessing,
    sendMessage,
    confirmAction,
    cancelAction,
    clearChat,
  } = useAiChat(projectId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 50);
    }
  }, [isOpen, messages, scrollToBottom]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "a") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleConfirm = useCallback(
    (msgId: string) => {
      const message = messages.find((m) => m.id === msgId);
      if (message?.actionPlan) {
        confirmAction(msgId);
      }
    },
    [messages, confirmAction],
  );

  const handleCancel = useCallback(
    (msgId: string) => {
      cancelAction(msgId);
    },
    [cancelAction],
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "fixed bottom-20 right-4 z-50 flex w-[380px] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:right-6",
              "bg-background/90 backdrop-blur-2xl",
              "dark:bg-background/85 dark:border-border/60",
              "max-h-[600px]",
              "max-sm:bottom-0 max-sm:right-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-none max-sm:border-x-0 max-sm:border-b-0 max-sm:max-h-dvh",
            )}
          >
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 flex size-8 items-center justify-center rounded-xl">
                  <Sparkles className="text-primary size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI Manager</h3>
                  {projectId && (
                    <p className="text-muted-foreground text-[10px] leading-tight">
                      Project context active
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
                  aria-label="Clear chat"
                >
                  <MessageSquare className="size-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
                  aria-label="Close AI Manager"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-primary/10 mb-3 flex size-12 items-center justify-center rounded-2xl">
                    <Bot className="text-primary size-6" />
                  </div>
                  <p className="mb-1 text-sm font-medium">AI Project Manager</p>
                  <p className="text-muted-foreground max-w-[260px] text-xs leading-relaxed">
                    I can help you create projects, manage tasks, assign members,
                    and generate reports.
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {[
                      "Create a website project",
                      "Add tasks to this project",
                      "Assign tasks to team members",
                      "Generate a sprint plan",
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => sendMessage(example)}
                        className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground w-full rounded-lg px-3 py-1.5 text-xs transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <AiChatMessage
                    key={msg.id}
                    message={msg}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    isConfirming={isProcessing}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <AiChatInput onSend={sendMessage} isProcessing={isProcessing} />

            <div className="border-border/50 flex items-center justify-center border-t px-4 py-1.5">
              <span className="text-muted-foreground/50 flex items-center gap-1 text-[10px]">
                <Sparkles className="size-2.5" />
                Powered by Gemini
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen((prev) => !prev)}
            className={cn(
              "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border p-3 shadow-lg transition-shadow hover:shadow-xl",
              "bg-background/85 backdrop-blur-2xl",
              "dark:bg-background/80 dark:border-border/60",
              "max-sm:bottom-20",
              isOpen && "shadow-primary/20",
            )}
            aria-label="Toggle AI Manager"
          >
            {isOpen ? (
              <ChevronDown className="text-foreground size-5" />
            ) : (
              <div className="relative">
                <Sparkles className="text-primary size-5" />
                <span className="bg-primary absolute -top-1 -right-1 size-2 animate-pulse rounded-full" />
              </div>
            )}
            <span className="text-foreground hidden text-sm font-medium sm:inline">
              {isOpen ? "Close" : "AI Manager"}
            </span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>AI Manager (Ctrl+Shift+A)</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
}
