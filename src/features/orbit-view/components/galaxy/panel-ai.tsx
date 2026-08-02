"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Lightbulb, ListChecks, Sigma, AlertTriangle, Users, Send } from "lucide-react";
import { aiApi } from "@/features/ai-manager/api/ai-api";

interface PanelAIProps {
  title: string;
  description?: string | null;
  onClose?: () => void;
}

const QUICK_ACTIONS = [
  { id: "improve", label: "Improve", icon: Lightbulb, prompt: "Improve this idea and make it more detailed" },
  { id: "tasks", label: "Generate Tasks", icon: ListChecks, prompt: "Generate a list of tasks needed to implement this idea" },
  { id: "estimate", label: "Estimate", icon: Sigma, prompt: "Estimate the complexity and time required for this idea" },
  { id: "risks", label: "Find Risks", icon: AlertTriangle, prompt: "Identify potential risks and challenges with this idea" },
  { id: "members", label: "Suggest Members", icon: Users, prompt: "Suggest team members who should work on this idea" },
];

export function PanelAI({ title, description }: PanelAIProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const askAI = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setActiveAction(prompt.slice(0, 30));
    setResponse(null);

    try {
      const res = await aiApi.sendMessage({
        message: `Context: "${title}"${description ? `\nDescription: ${description}` : ""}\n\n${prompt}`,
      });

      if (res.type === "chat" || res.type === "action_result") {
        setResponse(res.summary);
      } else {
        setResponse("AI is processing your request...");
      }
    } catch {
      setResponse("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  }, [title, description]);

  const handleSendCustom = useCallback(() => {
    if (!customPrompt.trim()) return;
    askAI(customPrompt);
    setCustomPrompt("");
  }, [customPrompt, askAI]);

  return (
    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-6 items-center justify-center rounded-lg bg-indigo-500/20">
          <Sparkles className="size-3 text-indigo-400" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ask AI</span>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => askAI(action.prompt)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-2 py-1 text-[9px] font-medium text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300 transition disabled:opacity-50"
          >
            <action.icon className="size-2.5" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-1.5">
        <input
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendCustom()}
          placeholder="Ask AI anything..."
          className="flex-1 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-[10px] text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition"
          disabled={isLoading}
        />
        <button
          onClick={handleSendCustom}
          disabled={isLoading || !customPrompt.trim()}
          className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition disabled:opacity-30"
        >
          {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
        </button>
      </div>

      {/* Response */}
      {isLoading && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-indigo-500/10 px-2.5 py-2">
          <Loader2 className="size-3 animate-spin text-indigo-400" />
          <span className="text-[9px] text-indigo-300">Analyzing...</span>
        </div>
      )}
      {response && !isLoading && (
        <motion.div
          className="mt-2.5 rounded-lg bg-white/5 px-2.5 py-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">{response}</p>
        </motion.div>
      )}
    </div>
  );
}
