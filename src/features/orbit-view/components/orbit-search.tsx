"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FileText, ListChecks, User, Tag, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";
import type { OrbitIdea, OrbitHubData, OrbitCard } from "@/features/orbit-view/types";
import type { Task, User as UserType } from "@/types/domain";

interface SearchableItem {
  id: string;
  type: "idea" | "task" | "member" | "sprint" | "milestone";
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  href?: string;
}

interface OrbitSearchProps {
  ideas: OrbitIdea[];
  tasks: Task[];
  members?: UserType[];
  hubs: OrbitHubData[];
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (item: SearchableItem) => void;
}

export function OrbitSearch({
  ideas,
  tasks,
  members = [],
  hubs,
  isOpen,
  onClose,
  onSelect,
}: OrbitSearchProps) {
  const [query, setQuery] = useState("");

  const items = useMemo<SearchableItem[]>(() => {
    const result: SearchableItem[] = [];

    ideas.forEach((idea) => {
      result.push({
        id: idea.id,
        type: "idea",
        title: idea.title,
        subtitle: idea.category ?? undefined,
        icon: "💡",
        color: "#a855f7",
      });
    });

    tasks.slice(0, 30).forEach((task) => {
      result.push({
        id: task.id,
        type: "task",
        title: task.title,
        subtitle: task.status,
        icon: task.status === "done" ? "✅" : task.status === "review" ? "👀" : "📋",
        color:
          task.status === "done"
            ? "#22c55e"
            : task.status === "review"
              ? "#f59e0b"
              : "#3b82f6",
      });
    });

    members.forEach((member) => {
      result.push({
        id: member.id,
        type: "member",
        title: member.name,
        subtitle: member.email,
        color: "#06b6d4",
      });
    });

    return result;
  }, [ideas, tasks, members]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 20);
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q),
    );
  }, [items, query]);

  const handleSelect = useCallback(
    (item: SearchableItem) => {
      onSelect?.(item);
      setQuery("");
      onClose();
    },
    [onSelect, onClose],
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "idea": return "💡";
      case "task": return "📋";
      case "member": return "👤";
      default: return "📌";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* Search panel */}
          <motion.div
            className="orbit-card-glass relative z-10 w-full max-w-lg rounded-2xl border shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
              <Search className="text-muted-foreground size-4 shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ideas, tasks, members..."
                className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                autoFocus
              />
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Sparkles className="text-muted-foreground/50 mb-2 size-8" />
                  <p className="text-muted-foreground text-xs">No results found</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {/* Group by type */}
                  {(["idea", "task", "member"] as const).map((type) => {
                    const group = filtered.filter((i) => i.type === type);
                    if (group.length === 0) return null;
                    return (
                      <div key={type}>
                        <p className="text-muted-foreground/60 px-2 py-1 text-[9px] font-medium uppercase tracking-wider">
                          {type}s
                        </p>
                        {group.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted/50"
                          >
                            <span className="text-sm">{item.icon ?? getTypeIcon(item.type)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{item.title}</p>
                              {item.subtitle && (
                                <p className="text-muted-foreground truncate text-[10px]">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${item.color ?? "#71717a"} 16%, transparent)`,
                                color: item.color ?? "#71717a",
                              }}
                            >
                              {item.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-border/30 px-3 py-1.5">
              <p className="text-muted-foreground/50 text-center text-[9px]">
                Type to search · Click to select · Esc to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
