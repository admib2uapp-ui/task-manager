"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Search, Users, BarChart3, ChevronRight, Sparkles } from "lucide-react";
import type { OrbitHubData, OrbitIdea, OrbitHubType } from "@/features/orbit-view/types";
import type { Task, User } from "@/types/domain";
import { ORBIT_HUB_META } from "@/features/orbit-view/types";

interface HubOverviewPanelProps {
  hubType: string;
  hubs: OrbitHubData[];
  ideas: OrbitIdea[];
  tasks: Task[];
  members: User[];
  projectId?: string;
  onClose: () => void;
  onNewIdea?: () => void;
  onIdeaClick?: (idea: OrbitIdea) => void;
}

export function HubOverviewPanel({
  hubType,
  hubs,
  ideas,
  tasks,
  members,
  projectId,
  onClose,
  onNewIdea,
  onIdeaClick,
}: HubOverviewPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const hub = hubs.find((h) => h.type === hubType);
  const meta = ORBIT_HUB_META[hubType as OrbitHubType];

  const hubIdeas = hubType === "ideas" ? ideas : [];

  const filteredIdeas = useMemo(
    () => hubIdeas.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [hubIdeas, searchQuery],
  );

  const recentIdeas = useMemo(
    () => [...hubIdeas]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [hubIdeas],
  );

  if (!hub) return null;

  return (
    <motion.div
      className="absolute top-24 left-6 z-30 w-72 rounded-2xl border border-white/8 bg-black/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
      style={{ boxShadow: `0 0 40px ${meta?.color ?? "#6366f1"}20, 0 0 80px ${meta?.color ?? "#6366f1"}10` }}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      drag
      dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta?.icon ?? "🌌"}</span>
          <div>
            <h3 className="text-xs font-black text-white">{meta?.label ?? hubType} Hub</h3>
            <p className="text-[9px] text-slate-400">{hub.count} items</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hubType === "ideas" && onNewIdea && (
            <button
              onClick={onNewIdea}
              className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              + New Idea
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 border-b border-white/8">
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <span className="text-slate-400 font-bold uppercase tracking-wider">Progress</span>
          <span className="font-bold text-white">{Math.round(hub.progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: meta?.color ?? "#6366f1" }}
            initial={{ width: 0 }}
            animate={{ width: `${hub.progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b border-white/8">
        <div className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2 py-1.5">
          <Search className="size-3 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${meta?.label?.toLowerCase()}...`}
            className="flex-1 bg-transparent text-[10px] text-white placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Recent items */}
      <div className="px-4 py-3 border-b border-white/8 max-h-48 overflow-y-auto">
        <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Recent {meta?.label ?? "Items"}
        </h4>
        {hubType === "ideas" ? (
          <div className="space-y-1.5">
            {recentIdeas.length === 0 && !searchQuery && (
              <div className="text-center py-4">
                <p className="text-[9px] text-slate-500 mb-2">No ideas yet. Be the first!</p>
                {onNewIdea && (
                  <button
                    onClick={onNewIdea}
                    className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                  >
                    ✨ Create First Idea
                  </button>
                )}
              </div>
            )}
            {searchQuery && filteredIdeas.length === 0 && (
              <p className="text-[9px] text-slate-500 py-2 text-center">No matching ideas</p>
            )}
            {filteredIdeas.length === 0 && searchQuery && (
              <p className="text-[9px] text-slate-500 py-2 text-center">No matching ideas</p>
            )}
            {(searchQuery ? filteredIdeas : recentIdeas).map((idea) => {
              const priorityColors: Record<string, string> = { critical: "#ef4444", high: "#f59e0b", medium: "#3b82f6", low: "#71717a" };
              return (
                <button
                  key={idea.id}
                  onClick={() => onIdeaClick?.(idea)}
                  className="flex w-full items-start gap-2 rounded-xl border border-white/5 bg-white/4 p-2 text-left hover:border-violet-500/30 hover:bg-white/8 transition group"
                >
                  <span className="mt-0.5 text-sm">🌟</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-slate-200 leading-snug truncate group-hover:text-white transition">
                      {idea.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: priorityColors[idea.priority] ?? "#71717a" }}
                      />
                      <span className="text-[8px] text-slate-500 capitalize">{idea.priority}</span>
                      {idea.members && idea.members.length > 0 && (
                        <>
                          <span className="text-[8px] text-slate-500">·</span>
                          <div className="flex -space-x-1">
                            {idea.members.slice(0, 3).map((m) => (
                              <span key={m.userId} className="size-3.5 rounded-full bg-indigo-600 flex items-center justify-center text-[6px] font-bold text-white ring-1 ring-black">
                                {m.user?.name?.charAt(0) ?? "?"}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-3 text-slate-600 group-hover:text-slate-400 transition mt-0.5 shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[9px] text-slate-500 py-2 text-center">Items shown in 3D view</p>
        )}
      </div>

      {/* Members section */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Users className="size-3 text-slate-400" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Members</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {members.slice(0, 8).map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-1.5 py-1"
            >
              <div className="size-4 rounded-full bg-indigo-600 flex items-center justify-center text-[7px] font-bold text-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[8px] text-slate-300">{member.name.split(" ")[0]}</span>
            </div>
          ))}
          {members.length > 8 && (
            <div className="rounded-lg border border-white/8 bg-white/5 px-1.5 py-1">
              <span className="text-[8px] text-slate-400">+{members.length - 8}</span>
            </div>
          )}
          {members.length === 0 && (
            <p className="text-[8px] text-slate-500">No members assigned</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
