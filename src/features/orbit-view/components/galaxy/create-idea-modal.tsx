"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Loader2, Send, UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { orbitIdeasApi } from "@/features/orbit-view/api/orbit-api";
import { aiApi } from "@/features/ai-manager/api/ai-api";
import { PanelFiles } from "@/features/orbit-view/components/galaxy/panel-files";
import type { OrbitIdea } from "@/features/orbit-view/types";
import { IDEA_CATEGORIES, IDEA_DEFAULT_TAGS, IDEA_PRIORITY_COLORS } from "@/features/orbit-view/types";
import type { User as DomainUser } from "@/types/domain";

interface CreateIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  members: DomainUser[];
  currentUser: DomainUser;
  userRole: string;
  onCreated?: (idea: OrbitIdea) => void;
}

const QUICK_AI_ACTIONS = [
  { id: "improve", label: "Improve Idea" },
  { id: "tasks", label: "Generate Tasks" },
  { id: "estimate", label: "Estimate" },
  { id: "risks", label: "Find Risks" },
  { id: "sprint", label: "Create Sprint" },
];

export function CreateIdeaModal({
  isOpen,
  onClose,
  projectId,
  members,
  currentUser,
  userRole,
  onCreated,
}: CreateIdeaModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [category, setCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const canAssign = userRole === "owner" || userRole === "senior";
  const canCreate = userRole !== "junior";

  const createMutation = useMutation({
    mutationFn: () =>
      orbitIdeasApi.create({
        projectId,
        title,
        description: description || null,
        priority,
        category: category || null,
        labels: selectedTags,
        assignedMemberIds: selectedMembers,
        status: "backlog",
      }),
    onSuccess: (newIdea) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orbit.ideas(projectId) });
      setShowAISuggestions(true);
      onCreated?.(newIdea);
    },
  });

  const handleCreate = useCallback(() => {
    if (!title.trim() || !description.trim()) return;
    if (!canCreate) return;
    createMutation.mutate();
  }, [title, description, canCreate, createMutation]);

  const handleAIAction = useCallback(async (action: string) => {
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const prompt = {
        improve: `Improve this idea and make it more detailed.\n\nTitle: ${title}\nDescription: ${description}\nPriority: ${priority}\nCategory: ${category}`,
        tasks: `Generate a list of development tasks for:\n\nTitle: ${title}\nDescription: ${description}`,
        estimate: `Estimate the complexity and time required for:\n\nTitle: ${title}\nDescription: ${description}`,
        risks: `Identify potential risks for:\n\nTitle: ${title}\nDescription: ${description}`,
        sprint: `Create a sprint plan for:\n\nTitle: ${title}\nDescription: ${description}`,
      }[action] ?? `Analyze this idea:\n\nTitle: ${title}\nDescription: ${description}`;

      const res = await aiApi.sendMessage({ message: prompt });
      setAiResponse(res.summary || "AI response received.");
    } catch {
      setAiResponse("Failed to get AI response.");
    } finally {
      setIsAiLoading(false);
    }
  }, [title, description, priority, category]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }, []);

  const toggleMember = useCallback((memberId: string) => {
    if (!canAssign && memberId !== currentUser.id) return;
    setSelectedMembers((prev) => prev.includes(memberId) ? prev.filter((m) => m !== memberId) : [...prev, memberId]);
  }, [canAssign, currentUser.id]);

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("");
    setSelectedTags([]);
    setSelectedMembers([]);
    setShowAISuggestions(false);
    setAiResponse(null);
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) { reset(); onClose(); } }}
    >
      <motion.div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-black/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 0 40px #6366f120, 0 0 80px #6366f110" }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/20">
              <Sparkles className="size-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">New Idea</h3>
              <p className="text-[9px] text-slate-400">
                {canCreate ? "Share your idea with the team" : "Suggest an idea"}
              </p>
            </div>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter idea title..."
              className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 transition"
              maxLength={300}
              disabled={!canCreate}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea..."
              rows={3}
              className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 transition resize-none"
              disabled={!canCreate}
            />
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-violet-500/50 transition"
                disabled={!canCreate}
              >
                <option value="">Select...</option>
                {IDEA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Priority</label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high", "critical"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    disabled={!canCreate}
                    className={`flex-1 rounded-lg border py-1.5 text-[9px] font-bold capitalize transition ${
                      priority === p
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/8 bg-white/5 text-slate-400 hover:border-white/20"
                    } disabled:opacity-50`}
                  >
                    <span className="block mx-auto mb-0.5 size-1.5 rounded-full" style={{ backgroundColor: IDEA_PRIORITY_COLORS[p] }} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {IDEA_DEFAULT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  disabled={!canCreate}
                  className={`rounded-lg border px-2.5 py-1 text-[9px] font-medium transition ${
                    selectedTags.includes(tag)
                      ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                      : "border-white/8 bg-white/5 text-slate-400 hover:border-white/20"
                  } disabled:opacity-50`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Assign Members */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Members
              {!canAssign && <span className="text-amber-400 ml-1">(self only)</span>}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedMembers.map((mid) => {
                const m = members.find((u) => u.id === mid);
                if (!m) return null;
                return (
                  <span key={mid} className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[9px] text-violet-300">
                    <span className="size-3 rounded-full bg-violet-600 flex items-center justify-center text-[6px] font-bold text-white">
                      {m.name.charAt(0)}
                    </span>
                    {m.name.split(" ")[0]}
                    <button onClick={() => toggleMember(mid)} className="ml-0.5 hover:text-white">
                      <X className="size-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {members.filter((m) => !selectedMembers.includes(m.id)).slice(0, 10).map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  disabled={!canCreate || (!canAssign && m.id !== currentUser.id)}
                  className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-2 py-1 text-[9px] text-slate-300 hover:border-white/20 transition disabled:opacity-30"
                >
                  <span className="size-3 rounded-full bg-indigo-600 flex items-center justify-center text-[6px] font-bold text-white">
                    {m.name.charAt(0)}
                  </span>
                  {m.name.split(" ")[0]}
                  <UserPlus className="size-2.5 ml-0.5 text-slate-500" />
                </button>
              ))}
              {members.length > 10 && (
                <span className="text-[8px] text-slate-500 px-1 py-1">+{members.length - 10} more</span>
              )}
            </div>
          </div>

          {/* Attachments */}
          <PanelFiles onUpload={() => {}} />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
          <button onClick={() => { reset(); onClose(); }} className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-slate-400 hover:text-white transition">
            Cancel
          </button>
          {showAISuggestions ? (
            <div className="flex items-center gap-1.5">
              {QUICK_AI_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAIAction(action.id)}
                  disabled={isAiLoading}
                  className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 text-[9px] font-medium text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-50"
                >
                  <Sparkles className="size-2.5" />
                  {action.label}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!title.trim() || !description.trim() || createMutation.isPending || !canCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-[10px] font-bold text-white hover:bg-violet-500 transition disabled:opacity-40"
            >
              {createMutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              {canCreate ? "Create Idea" : "Suggest"}
            </button>
          )}
        </div>

        {/* AI response */}
        {aiResponse && (
          <div className="px-5 py-3 border-t border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-start gap-2">
              <Sparkles className="size-3 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-300 leading-relaxed">{aiResponse}</p>
            </div>
          </div>
        )}

        {/* Permission notice */}
        {!canCreate && (
          <div className="px-5 py-2 bg-amber-500/10 border-t border-amber-500/20">
            <p className="text-[9px] text-amber-300">You are in suggestion mode. Your idea will be reviewed by a project lead.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
