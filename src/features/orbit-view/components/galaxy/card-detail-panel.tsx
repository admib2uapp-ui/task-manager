"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Maximize2, Minimize2, User, Calendar, Clock, Tag, Activity } from "lucide-react";
import { PanelComments } from "@/features/orbit-view/components/galaxy/panel-comments";
import { PanelFiles } from "@/features/orbit-view/components/galaxy/panel-files";
import { PanelAI } from "@/features/orbit-view/components/galaxy/panel-ai";
import type { OrbitIdea, OrbitHubType } from "@/features/orbit-view/types";
import type { Task, User as DomainUser } from "@/types/domain";

export type SelectedObject = {
  type: "idea" | "task" | "bug" | "testing" | "review" | "milestone";
  id: string;
  hubType: string;
  data: OrbitIdea | Task;
};

interface CardDetailPanelProps {
  object: SelectedObject;
  members: DomainUser[];
  onClose: () => void;
}

const HUB_ICONS: Record<string, string> = {
  ideas: "💡",
  development: "⚙",
  testing: "🧪",
  review: "👀",
  completed: "✅",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#71717a",
};

export function CardDetailPanel({ object, members, onClose }: CardDetailPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const idea = object.type === "idea" ? (object.data as OrbitIdea) : null;
  const task = object.type === "task" ? (object.data as Task) : null;
  const title = idea?.title ?? task?.title ?? "Unknown";
  const description = idea?.description ?? task?.description ?? null;
  const priority = idea?.priority ?? task?.priority ?? "medium";
  const assignee = task?.assignee ?? null;
  const ideaMembers = idea?.members ?? [];
  const deadline = idea?.dueDate ?? task?.deadline ?? null;

  // Activity history
  const [activities, setActivities] = useState<{ icon: string; text: string; time: string }[]>([]);
  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`/api/v1/activity?entityType=${object.type}&entityId=${object.id}&limit=5`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setActivities(data.map((a: Record<string, unknown>) => {
            const action = String(a.action ?? "");
            const actor = (a.actor as Record<string, unknown>) ?? {};
            return {
              icon: action.startsWith("AI_") ? "🤖" : action === "comment" ? "💬" : "👤",
              text: `${action || "updated"} by ${String(actor?.name ?? "system")}`,
              time: a.created_at ? new Date(String(a.created_at)).toLocaleDateString() : "",
            };
          }));
        }
      } catch {}
    }
    fetchActivity();
  }, [object.id, object.type]);

  return (
    <motion.div
      className="absolute z-30 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
      style={{
        width: isExpanded ? 420 : 340,
        maxHeight: "70vh",
        right: 24,
        bottom: 100,
        boxShadow: `0 0 40px ${PRIORITY_COLORS[priority] ?? "#6366f1"}20, 0 0 80px ${PRIORITY_COLORS[priority] ?? "#6366f1"}10`,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      drag
      dragConstraints={{ left: 0, right: 500, top: 0, bottom: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{HUB_ICONS[object.hubType] ?? "📌"}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate">{title}</span>
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[priority] ?? "#71717a" }}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${PRIORITY_COLORS[priority] ?? "#71717a"}20`,
                  color: PRIORITY_COLORS[priority] ?? "#71717a",
                }}
              >
                {priority}
              </span>
              <span className="text-[8px] text-slate-500 capitalize">{object.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            {isExpanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 52px)" }}>
        {/* Description */}
        {description && (
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[10px] text-slate-300 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Quick info */}
        <div className="px-4 py-3 border-b border-white/8 space-y-2">
          {assignee && (
            <div className="flex items-center gap-2 text-[10px]">
              <User className="size-3 text-slate-400" />
              <span className="text-slate-300">{assignee.name}</span>
            </div>
          )}
          {ideaMembers.length > 0 && (
            <div className="flex items-center gap-2 text-[10px]">
              <User className="size-3 text-slate-400" />
              <div className="flex -space-x-1.5">
                {ideaMembers.slice(0, 5).map((m) => (
                  <span key={m.userId} className="size-5 rounded-full bg-indigo-600 flex items-center justify-center text-[7px] font-bold text-white ring-1 ring-black">
                    {m.user?.name?.charAt(0) ?? "?"}
                  </span>
                ))}
                {ideaMembers.length > 5 && (
                  <span className="size-5 rounded-full bg-slate-700 flex items-center justify-center text-[7px] font-bold text-slate-300 ring-1 ring-black">
                    +{ideaMembers.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
          {deadline && (
            <div className="flex items-center gap-2 text-[10px]">
              <Calendar className="size-3 text-slate-400" />
              <span className="text-slate-300">{new Date(deadline).toLocaleDateString()}</span>
            </div>
          )}
          {task?.estimatedHours && (
            <div className="flex items-center gap-2 text-[10px]">
              <Clock className="size-3 text-slate-400" />
              <span className="text-slate-300">{task.estimatedHours}h estimated</span>
            </div>
          )}
          {task?.timeSpentSeconds != null && task.timeSpentSeconds > 0 && (
            <div className="flex items-center gap-2 text-[10px]">
              <Clock className="size-3 text-slate-400" />
              <span className="text-slate-300">{Math.round(task.timeSpentSeconds / 3600)}h spent</span>
            </div>
          )}
          {idea?.labels && idea.labels.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <Tag className="size-3 text-slate-400" />
              <div className="flex flex-wrap gap-1">
                {idea.labels.map((label) => (
                  <span key={label} className="rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] text-slate-300">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="px-4 py-3 border-b border-white/8">
          <PanelFiles
            files={task?.attachments?.map((a) => ({ id: a.id, name: a.fileName, size: a.sizeBytes, type: a.mimeType, url: a.fileUrl })) ?? []}
          />
        </div>

        {/* Comments */}
        <div className="px-4 py-3 border-b border-white/8">
          <PanelComments
            comments={task?.comments?.map((c) => ({
              id: c.id,
              author: c.author ?? { name: "Unknown", avatarUrl: null },
              body: c.body,
              createdAt: c.createdAt,
              reactions: [],
            })) ?? (idea ? [{
              id: "placeholder",
              author: members[0] ?? { name: "Team", avatarUrl: null },
              body: "This idea was submitted for review.",
              createdAt: idea.createdAt,
              reactions: [{ emoji: "❤️", count: 2 }],
            }] : [])}
            onAddComment={() => {}}
            onAddReply={() => {}}
            onReact={() => {}}
          />
        </div>

        {/* Activity history */}
        {activities.length > 0 && (
          <div className="px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="size-3 text-slate-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Activity</span>
            </div>
            <div className="space-y-1.5">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-[9px]">
                  <span className="mt-0.5">{a.icon}</span>
                  <span className="text-slate-300 flex-1">{a.text}</span>
                  <span className="text-slate-500 shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI panel */}
        <div className="px-4 py-3 border-b border-white/8">
          <PanelAI title={title} description={description} />
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between text-[8px] text-slate-500">
          <span>ID: {object.id.slice(0, 8)}...</span>
          <span>{object.hubType} · {object.type}</span>
        </div>
      </div>
    </motion.div>
  );
}
