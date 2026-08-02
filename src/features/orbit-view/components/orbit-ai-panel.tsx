"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Lightbulb,
  ArrowRight,
  Check,
  ThumbsUp,
  Brain,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrbitHubData, OrbitIdea } from "@/features/orbit-view/types";
import type { Task } from "@/types/domain";

interface AISuggestion {
  id: string;
  type: string;
  summary: string;
  action: string;
  confidence: "high" | "medium" | "low";
  applied?: boolean;
  dismissed?: boolean;
}

interface OrbitAIPanelProps {
  hubs: OrbitHubData[];
  ideas: OrbitIdea[];
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}

function generateSuggestions(
  hubs: OrbitHubData[],
  ideas: OrbitIdea[],
  tasks: Task[],
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // Check ideas without tasks
  const ideasWithTasks = ideas.filter((i) => (i.relatedTaskIds?.length ?? 0) > 0);
  const ideasWithoutTasks = ideas.filter(
    (i) => (i.relatedTaskIds?.length ?? 0) === 0 && i.status === "submitted",
  );
  if (ideasWithoutTasks.length > 0) {
    suggestions.push({
      id: "move-ideas",
      type: "workflow",
      summary: `${ideasWithoutTasks.length} approved idea${ideasWithoutTasks.length > 1 ? "s" : ""} waiting to move to Development`,
      action: "Move to Development",
      confidence: "high",
    });
  }

  // Check tasks in development without testing
  const devTasks = tasks.filter((t) => t.status === "in_progress");
  const devNoSubtasks = devTasks.filter(
    (t) => !t.subtasks || t.subtasks.length === 0,
  );
  if (devNoSubtasks.length > 0) {
    suggestions.push({
      id: "split-tasks",
      type: "refinement",
      summary: `${devNoSubtasks.length} task${devNoSubtasks.length > 1 ? "s" : ""} in Development without subtasks`,
      action: "Suggest Subtasks",
      confidence: "medium",
    });
  }

  // Check tasks in review without reviewer
  const reviewTasks = tasks.filter((t) => t.status === "review" && !t.assigneeId);
  if (reviewTasks.length > 0) {
    suggestions.push({
      id: "assign-reviewer",
      type: "workflow",
      summary: `${reviewTasks.length} task${reviewTasks.length > 1 ? "s" : ""} awaiting review assignment`,
      action: "Assign Reviewer",
      confidence: "high",
    });
  }

  // Check overdue tasks
  const overdue = tasks.filter((t) => {
    if (!t.deadline || t.status === "done") return false;
    return new Date(t.deadline) < new Date();
  });
  if (overdue.length > 0) {
    suggestions.push({
      id: "overdue",
      type: "risk",
      summary: `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""} need attention`,
      action: "View Overdue",
      confidence: "high",
    });
  }

  // Check test coverage
  const doneTasks = tasks.filter((t) => t.status === "done");
  const totalTasks = tasks.length;
  if (totalTasks > 0 && doneTasks.length / totalTasks < 0.3) {
    suggestions.push({
      id: "testing-coverage",
      type: "insight",
      summary: `Low completion rate (${Math.round((doneTasks.length / totalTasks) * 100)}%). Consider adjusting scope.`,
      action: "Review Scope",
      confidence: "medium",
    });
  }

  // Sprint suggestion
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  if (inProgress > 8) {
    suggestions.push({
      id: "create-sprint",
      type: "planning",
      summary: `${inProgress} tasks in progress — consider creating a sprint to organize them`,
      action: "Create Sprint",
      confidence: "medium",
    });
  }

  // Limit to top 6
  return suggestions.slice(0, 6);
}

const CONFIDENCE_COLORS = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#ef4444",
};

const TYPE_ICONS: Record<string, string> = {
  workflow: "🔄",
  refinement: "✂️",
  risk: "⚠️",
  insight: "💡",
  planning: "📋",
};

export function OrbitAIPanel({
  hubs,
  ideas,
  tasks,
  isOpen,
  onClose,
}: OrbitAIPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(() =>
    generateSuggestions(hubs, ideas, tasks),
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApply = useCallback(
    async (id: string) => {
      setIsProcessing(true);
      // Simulate AI action
      await new Promise((r) => setTimeout(r, 800));
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, applied: true } : s)),
      );
      setIsProcessing(false);
    },
    [],
  );

  const handleDismiss = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, dismissed: true } : s)),
    );
  }, []);

  const handleRefresh = useCallback(() => {
    setSuggestions(generateSuggestions(hubs, ideas, tasks));
  }, [hubs, ideas, tasks]);

  const activeSuggestions = suggestions.filter((s) => !s.dismissed && !s.applied);
  const appliedCount = suggestions.filter((s) => s.applied).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed right-4 top-20 z-50 w-[340px] sm:right-6 sm:top-24"
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="orbit-card-glass max-h-[500px] overflow-hidden rounded-2xl border shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 flex size-7 items-center justify-center rounded-lg">
                  <Brain className="text-primary size-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold">AI Orbit</h3>
                  <p className="text-muted-foreground/70 text-[9px] leading-tight">
                    Smart suggestions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {appliedCount > 0 && (
                  <span className="text-muted-foreground text-[9px]">
                    {appliedCount} done
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={isProcessing}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors disabled:opacity-50"
                >
                  <Sparkles className={cn("size-3.5", isProcessing && "animate-pulse")} />
                </button>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="scrollbar-thin space-y-1.5 overflow-y-auto p-2">
              {activeSuggestions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <ThumbsUp className="text-muted-foreground/30 mb-2 size-8" />
                  <p className="text-muted-foreground/50 text-[10px]">
                    All caught up! No suggestions right now.
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="mt-2 rounded-lg px-2 py-1 text-[9px] font-medium text-primary hover:bg-primary/10"
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                activeSuggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.id}
                    className="rounded-xl border border-border/30 bg-muted/20 p-2.5"
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-sm">
                        {TYPE_ICONS[suggestion.type] ?? "💡"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[8px] font-medium capitalize"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${CONFIDENCE_COLORS[suggestion.confidence]} 16%, transparent)`,
                              color: CONFIDENCE_COLORS[suggestion.confidence],
                            }}
                          >
                            {suggestion.type}
                          </span>
                          <span
                            className="ml-auto size-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                CONFIDENCE_COLORS[suggestion.confidence],
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-foreground/80">
                          {suggestion.summary}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDismiss(suggestion.id)}
                        className="text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 text-[9px] transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleApply(suggestion.id)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-medium text-white transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: CONFIDENCE_COLORS[suggestion.confidence],
                        }}
                      >
                        {isProcessing ? (
                          <Loader2 className="size-2.5 animate-spin" />
                        ) : (
                          <Check className="size-2.5" />
                        )}
                        {suggestion.action}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/30 px-3 py-1.5">
              <span className="text-muted-foreground/50 text-[9px]">
                ✨ AI-powered suggestions
              </span>
              <span className="text-muted-foreground/50 flex items-center gap-1 text-[9px]">
                <Brain className="size-2.5" />
                Gemini
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
