"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, X, Clock, Sparkles } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { OrbitHubData, OrbitIdea } from "@/features/orbit-view/types";
import type { Task, Project, User as DomainUser } from "@/types/domain";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { HubOverviewPanel } from "@/features/orbit-view/components/galaxy/hub-overview-panel";
import { CardDetailPanel, type SelectedObject } from "@/features/orbit-view/components/galaxy/card-detail-panel";
import { CreateIdeaModal } from "@/features/orbit-view/components/galaxy/create-idea-modal";

interface GalaxyViewProps {
  hubs: OrbitHubData[];
  ideas: OrbitIdea[];
  tasks: Task[];
  project?: Project;
  members?: DomainUser[];
  onSwitchTo2D?: () => void;
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!(gl instanceof WebGLRenderingContext)) return false;
    return true;
  } catch {
    return false;
  }
}

const GalaxySceneLazy = dynamic(
  () =>
    import("@/features/orbit-view/components/galaxy/galaxy-scene").then(
      (m) => m.GalaxyScene,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-3 text-3xl">🪐</div>
          <p className="text-muted-foreground text-xs">Loading 3D scene...</p>
        </div>
      </div>
    ),
  },
);

// ─── Project Overview Panel ──────────────────────────────────
function ProjectOverviewPanel({
  project,
  hubs,
  tasks,
  onClose,
}: {
  project?: Project;
  hubs: OrbitHubData[];
  tasks: Task[];
  onClose: () => void;
}) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="absolute right-0 top-0 bottom-0 w-80 z-30 flex flex-col border-l border-white/8 bg-black/90 backdrop-blur-2xl overflow-y-auto"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{project?.icon ?? "🌌"}</span>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight">{project?.name ?? "Project Overview"}</h3>
            <p className="text-[10px] text-slate-400 capitalize">{project?.status ?? "active"}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition">
          <X className="size-4" />
        </button>
      </div>

      <div className="px-5 py-4 border-b border-white/8">
        <div className="flex items-end justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Progress</span>
          <span className="text-2xl font-black text-white">{project?.progress ?? overallProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${project?.progress ?? overallProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/5 p-2">
            <div className="text-lg font-black text-white">{totalTasks}</div>
            <div className="text-[9px] text-slate-400 uppercase">Total</div>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2">
            <div className="text-lg font-black text-emerald-400">{doneTasks}</div>
            <div className="text-[9px] text-slate-400 uppercase">Done</div>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-2">
            <div className="text-lg font-black text-blue-400">{inProgressTasks}</div>
            <div className="text-[9px] text-slate-400 uppercase">Active</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-white/8">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Hub Breakdown</h4>
        <div className="space-y-2.5">
          {hubs.map((hub) => (
            <div key={hub.type} className="flex items-center gap-3">
              <span className="text-base">{hub.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-300">{hub.label}</span>
                  <span className="text-[11px] font-black text-white">{hub.count}</span>
                </div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${hub.progress}%`, backgroundColor: hub.color }} />
                </div>
              </div>
              <span className="text-[10px] font-bold" style={{ color: hub.color }}>{Math.round(hub.progress)}%</span>
            </div>
          ))}
        </div>
      </div>

      {project?.description && (
        <div className="px-5 py-4 border-b border-white/8">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">{project.description}</p>
        </div>
      )}
      {project?.deadline && (
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="size-3.5" />
            <span>Deadline:</span>
            <span className="text-white font-semibold">{new Date(project.deadline).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main GalaxyView ─────────────────────────────────────────
export function GalaxyView(props: GalaxyViewProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [hasError] = useState(false);
  const [activePanel, setActivePanel] = useState<"none" | "project">("none");
  const [selectedHubType, setSelectedHubType] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);
  const [cameraTarget, setCameraTarget] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const setGalaxyView = useUIStore((s) => s.setGalaxyView);
  const currentUser = useAuthStore((s) => s.user);
  const userRole = currentUser?.workspaceRole ?? "general";

  useEffect(() => { setWebglSupported(checkWebGLSupport()); }, []);

  // Collect all unique members
  const allMembers = Array.from(
    new Map(
      props.hubs.flatMap((h) =>
        h.cards.flatMap((c) =>
          c.assignees.map((u) => [u.id, u] as [string, DomainUser])
        )
      )
    ).values()
  );

  const handleCenterClick = useCallback(() => {
    setActivePanel((p) => (p === "project" ? "none" : "project"));
    setSelectedHubType(null);
    setSelectedObject(null);
    setCameraTarget(null);
  }, []);

  const handleHubClick = useCallback((hubType: string) => {
    if (hubType === "overview") {
      handleCenterClick();
      return;
    }
    setSelectedObject(null);
    setActivePanel("none");
    setSelectedHubType((prev) => (prev === hubType ? null : hubType));
    setCameraTarget(hubType);
  }, [handleCenterClick]);

  const handleObjectClick = useCallback((obj: SelectedObject) => {
    setSelectedHubType(null);
    setActivePanel("none");
    setSelectedObject((prev) => (prev?.id === obj.id ? null : obj));
    setCameraTarget(obj.id);
  }, []);

  const closeAll = useCallback(() => {
    setActivePanel("none");
    setSelectedHubType(null);
    setSelectedObject(null);
    setCameraTarget(null);
  }, []);

  if (webglSupported === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-3 text-3xl">🪐</div>
          <p className="text-muted-foreground text-xs">Initializing Galaxy...</p>
        </div>
      </div>
    );
  }

  if (!webglSupported || hasError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="orbit-card-glass max-w-sm rounded-2xl border p-6 text-center">
          <AlertTriangle className="text-warning mx-auto mb-3 size-8" />
          <h3 className="mb-1 text-sm font-semibold">WebGL Unavailable</h3>
          <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
            Your device or browser doesn&apos;t support the 3D Galaxy View.
          </p>
          <button
            onClick={() => { setGalaxyView(false); props.onSwitchTo2D?.(); }}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs font-medium transition-colors hover:opacity-90"
          >
            Switch to 2D View
          </button>
        </div>
      </div>
    );
  }

  const selectedId = selectedObject?.id ?? null;

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-3xl bg-[#030409] text-white">
      {/* 3D Canvas */}
      <div className="relative flex-1 h-full">
        <GalaxySceneLazy
          hubs={props.hubs}
          ideas={props.ideas}
          tasks={props.tasks}
          selectedId={selectedId}
          selectedHubType={selectedHubType}
          cameraTarget={cameraTarget}
          onCenterClick={handleCenterClick}
          onHubClick={handleHubClick}
          onObjectClick={handleObjectClick}
        />

        {/* Top header */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-2xl border border-white/5 bg-black/60 p-1 backdrop-blur-md">
          <button className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">Galaxy View</button>
          <button className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white" onClick={props.onSwitchTo2D}>
            Graph View
          </button>
          <button className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white" onClick={props.onSwitchTo2D}>
            Analytics
          </button>
          <button
            onClick={closeAll}
            className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            ✕ Clear
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="ml-2 flex items-center gap-1 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition"
          >
            <Sparkles className="size-3" />
            New Idea
          </button>
        </div>

        {/* Bottom stats bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5 rounded-2xl border border-white/5 bg-black/75 p-2 backdrop-blur-md">
          {props.hubs.map((hub) => {
            const colors: Record<string, string> = { ideas: "#a855f7", development: "#3b82f6", testing: "#22c55e", review: "#f59e0b", completed: "#22c55e" };
            const color = colors[hub.type] ?? "#fff";
            return (
              <button
                key={hub.type}
                onClick={() => handleHubClick(hub.type)}
                className={`flex items-center gap-2 border-r border-white/5 pr-3 last:border-0 last:pr-0 transition hover:opacity-80 ${
                  selectedHubType === hub.type ? "opacity-100" : ""
                }`}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{hub.label}</span>
                <span className="text-xs font-black text-white">{hub.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels */}
      <AnimatePresence>
        {activePanel === "project" && (
          <ProjectOverviewPanel
            key="project-panel"
            project={props.project}
            hubs={props.hubs}
            tasks={props.tasks}
            onClose={() => setActivePanel("none")}
          />
        )}
      </AnimatePresence>

      {/* Hub Overview Panel (floating) */}
      <AnimatePresence>
        {selectedHubType && selectedHubType !== "overview" && (
          <HubOverviewPanel
            key={`hub-${selectedHubType}`}
            hubType={selectedHubType}
            hubs={props.hubs}
            ideas={props.ideas}
            tasks={props.tasks}
            members={allMembers}
            projectId={props.project?.id}
            onClose={() => setSelectedHubType(null)}
            onNewIdea={() => setShowCreateModal(true)}
            onIdeaClick={(idea) =>
              handleObjectClick({
                type: "idea",
                id: idea.id,
                hubType: selectedHubType,
                data: idea,
              })
            }
          />
        )}
      </AnimatePresence>

      {/* Card Detail Panel (floating) */}
      <AnimatePresence>
        {selectedObject && (
          <CardDetailPanel
            key={`detail-${selectedObject.id}`}
            object={selectedObject}
            members={allMembers}
            onClose={() => setSelectedObject(null)}
          />
        )}
      </AnimatePresence>

      {/* Create Idea Modal */}
      {currentUser && (
        <CreateIdeaModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={props.project?.id}
          members={allMembers}
          currentUser={currentUser}
          userRole={userRole}
          onCreated={(newIdea) => {
            setShowCreateModal(false);
            handleObjectClick({ type: "idea", id: newIdea.id, hubType: "ideas", data: newIdea });
          }}
        />
      )}
    </div>
  );
}
