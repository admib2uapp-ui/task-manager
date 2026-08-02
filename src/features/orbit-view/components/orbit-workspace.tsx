"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
} from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Share2, Clock, BarChart3, Target } from "lucide-react";

import { projectsApi } from "@/features/projects/api/projects-api";
import { OrbitHeader } from "@/features/orbit-view/components/orbit-header";
import { OrbitHubNode } from "@/features/orbit-view/components/orbit-hub-node";
import { OrbitCardBase } from "@/features/orbit-view/components/cards/orbit-card-base";
import { IdeaCard } from "@/features/orbit-view/components/cards/idea-card";
import { DevCard } from "@/features/orbit-view/components/cards/dev-card";
import { TestingCard } from "@/features/orbit-view/components/cards/testing-card";
import { ReviewCard } from "@/features/orbit-view/components/cards/review-card";
import { CompletedCard } from "@/features/orbit-view/components/cards/completed-card";
import { DependencyGraph } from "@/features/orbit-view/components/deps/dependency-graph";
import { FullProjectViz } from "@/features/orbit-view/components/full-viz/full-project-viz";
import { OrbitTimelineSlider } from "@/features/orbit-view/components/orbit-timeline-slider";
import { OrbitAnalytics } from "@/features/orbit-view/components/orbit-analytics";
import { OrbitSearch } from "@/features/orbit-view/components/orbit-search";
import { OrbitFilters } from "@/features/orbit-view/components/orbit-filters";
import { SprintView } from "@/features/orbit-view/components/sprint/sprint-view";
import { SprintBurndown } from "@/features/orbit-view/components/sprint/sprint-burndown";
import { SprintCalendar } from "@/features/orbit-view/components/sprint/sprint-calendar";
import { OrbitRiskNodes } from "@/features/orbit-view/components/orbit-risk-nodes";
import { OrbitTeamAvatars } from "@/features/orbit-view/components/orbit-team-avatars";
import { OrbitAIPanel } from "@/features/orbit-view/components/orbit-ai-panel";
import { GalaxyView } from "@/features/orbit-view/components/galaxy/galaxy-view";
import { useOrbitData } from "@/features/orbit-view/hooks/use-orbit-data";
import { useOrbitDragDrop } from "@/features/orbit-view/hooks/use-orbit-drag-drop";
import { useOrbitRealtime } from "@/features/orbit-view/hooks/use-orbit-realtime";
import { useOrbitAnalytics } from "@/features/orbit-view/hooks/use-orbit-analytics";
import { OrbitProgressRing } from "@/features/orbit-view/components/orbit-progress-ring";
import { orbitSprintsApi, orbitRisksApi } from "@/features/orbit-view/api/orbit-api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { OrbitViewMode, OrbitCard, OrbitFilters as OrbitFiltersType } from "@/features/orbit-view/types";

type WorkspaceTab = "hubs" | "graph" | "timeline" | "analytics" | "sprints";

export function OrbitWorkspace() {
  const [viewMode, setViewMode] = useState<OrbitViewMode>("galaxy");
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("hubs");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters] = useState<OrbitFiltersType>({});
  const [graphFullscreen, setGraphFullscreen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [currentSprintId, setCurrentSprintId] = useState<string | undefined>();

  // Sidebar state for galaxy fullscreen positioning
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  // Fetch projects
  const projectsQuery = useQuery({
    queryKey: ["projects", "list", { includeArchived: false }],
    queryFn: () => projectsApi.list({ includeArchived: false }),
  });

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const projectId = selectedProjectId;

  // Orbit data hooks
  const { hubs, ideas, allTasks, isLoading, error, refetch } = useOrbitData(projectId);
  useOrbitRealtime(projectId);
  const { analytics, refresh: refreshAnalytics, isRefreshing } = useOrbitAnalytics(projectId);

  // Sprints
  const sprintsQuery = useQuery({
    queryKey: queryKeys.orbit.sprints(projectId ?? ""),
    queryFn: () => orbitSprintsApi.list(projectId!),
    enabled: !!projectId,
  });
  const sprints = useMemo(() => sprintsQuery.data ?? [], [sprintsQuery.data]);

  useEffect(() => {
    if (!currentSprintId && sprints.length > 0) {
      const active = sprints.find((s) => s.status === "active");
      setCurrentSprintId(active?.id ?? sprints[0].id);
    }
  }, [sprints, currentSprintId]);

  // Risks
  const risksQuery = useQuery({
    queryKey: queryKeys.orbit.risks(projectId ?? ""),
    queryFn: () => orbitRisksApi.list(projectId!),
    enabled: !!projectId,
  });
  const risks = risksQuery.data ?? [];

  // Drag & drop
  const {
    sensors,
    activeCard,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useOrbitDragDrop({
    projectId,
    onCardMoved: () => refetch(),
  });

  const renderCard = useCallback((card: OrbitCard) => {
    switch (card.hubType) {
      case "ideas":
        return <IdeaCard card={card} compact />;
      case "development":
        return <DevCard card={card} compact />;
      case "testing":
        return <TestingCard card={card} compact />;
      case "review":
        return <ReviewCard card={card} compact />;
      case "completed":
        return <CompletedCard card={card} compact />;
      default:
        return <OrbitCardBase card={card} compact />;
    }
  }, []);

  const handleOpenFullViz = useCallback(() => {
    setViewMode("full-viz");
    setWorkspaceTab("graph");
  }, []);

  // Not ready — projects still loading
  const projectsLoading = projectsQuery.isLoading;

  // Timeline events
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      date: string;
      type: "task_created" | "dev_started" | "testing_started" | "review_started" | "completed";
      title: string;
    }> = [];

    allTasks.forEach((task) => {
      events.push({
        id: `create-${task.id}`,
        date: task.createdAt,
        type: "task_created",
        title: `Task created: ${task.title}`,
      });
      if (task.status === "in_progress") {
        events.push({
          id: `dev-${task.id}`,
          date: task.updatedAt,
          type: "dev_started",
          title: `Development started: ${task.title}`,
        });
      }
      if (task.status === "review") {
        events.push({
          id: `review-${task.id}`,
          date: task.updatedAt,
          type: "review_started",
          title: `Review started: ${task.title}`,
        });
      }
      if (task.status === "done") {
        events.push({
          id: `done-${task.id}`,
          date: task.updatedAt,
          type: "completed",
          title: `Completed: ${task.title}`,
        });
      }
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allTasks]);

  // Collect unique members from all hubs
  const allMembers = useMemo(() => {
    const memberMap = new Map<string, { id: string; name: string; email: string; avatarUrl: string | null; createdAt: string; updatedAt: string; isOnline?: boolean }>();
    hubs.forEach((hub) => {
      hub.cards.forEach((card) => {
        card.assignees.forEach((user) => {
          if (!memberMap.has(user.id)) {
            memberMap.set(user.id, { ...user, isOnline: Math.random() > 0.5 });
          }
        });
      });
    });
    return Array.from(memberMap.values());
  }, [hubs]);

  const workspaceTabs: Array<{ id: WorkspaceTab; label: string; icon: typeof LayoutGrid }> = [
    { id: "hubs", label: "Hubs", icon: LayoutGrid },
    { id: "graph", label: "Graph", icon: Share2 },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "sprints", label: "Sprints", icon: Target },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (!projectId || projectsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin mb-4 text-4xl">🪐</div>
          <div className="bg-muted mx-auto h-3 w-32 animate-pulse rounded-full" />
          <div className="bg-muted mx-auto h-2 w-48 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 text-4xl">🪐</div>
          <p className="text-muted-foreground text-sm">Loading Orbit View...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-danger mb-2 text-lg">⚠</p>
          <p className="text-muted-foreground text-sm">Failed to load workspace</p>
        </div>
      </div>
    );
  }

  const currentSprint = sprints.find((s) => s.id === currentSprintId) ?? sprints[0];

  return (
    <div className="relative flex h-full flex-col p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <OrbitHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefreshAnalytics={refreshAnalytics}
        isRefreshing={isRefreshing}
        onSearch={() => setSearchOpen(true)}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
        onToggleAI={() => setAiPanelOpen(!aiPanelOpen)}
        aiPanelOpen={aiPanelOpen}
      />

      {/* Project selector */}
      {projects.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium transition-all sm:text-xs",
                p.id === projectId
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
              style={
                p.id === projectId
                  ? { backgroundColor: p.color, color: "#fff" }
                  : undefined
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Workspace content */}
      <AnimatePresence mode="wait">
        {viewMode === "workspace" && (
          <motion.div
            key="workspace"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Workspace tabs */}
            <div className="mb-4 flex items-center gap-1 self-center rounded-xl bg-muted/50 p-0.5">
              {workspaceTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setWorkspaceTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all sm:text-xs",
                    workspaceTab === id
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {workspaceTab === "hubs" && (
              <div className="relative flex flex-1 flex-col items-center justify-start overflow-y-auto w-full py-4 min-h-[480px]">
                {/* Visual Connection line behind the circular nodes */}
                <div className="absolute top-28 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-[#a855f7]/60 via-[#3b82f6]/60 via-[#22c55e]/60 via-[#f59e0b]/60 to-[#22c55e]/60 hidden lg:block z-0 pointer-events-none" />

                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-7xl items-start justify-between gap-6 px-4">
                    {hubs.map((hub, index) => (
                      <motion.div
                        key={hub.type}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="flex-1 w-full flex justify-center"
                      >
                        <OrbitHubNode
                          type={hub.type}
                          cards={hub.cards}
                          progress={hub.progress}
                          count={hub.count}
                          onOpenFullViz={handleOpenFullViz}
                          renderCard={renderCard}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <DragOverlay>
                    {activeCard && (
                      <div className="rotate-2 opacity-90">
                        {renderCard(activeCard)}
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              </div>
            )}

            {workspaceTab === "graph" && (
              <div className="flex-1">
                <DependencyGraph
                  ideas={ideas}
                  tasks={allTasks}
                  hubs={hubs}
                />
              </div>
            )}

            {workspaceTab === "timeline" && (
              <div className="flex-1 overflow-y-auto">
                <OrbitTimelineSlider
                  events={timelineEvents}
                  className="mx-auto max-w-3xl"
                />
              </div>
            )}

            {workspaceTab === "sprints" && (
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <SprintView
                      sprints={sprints}
                      tasks={allTasks}
                      currentSprintId={currentSprintId}
                      onSprintChange={setCurrentSprintId}
                    />
                  </div>
                  <div className="space-y-4">
                    {currentSprint && (
                      <>
                        <SprintBurndown
                          sprint={currentSprint}
                          tasks={allTasks}
                        />
                        <SprintCalendar
                          sprint={currentSprint}
                          tasks={allTasks}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {workspaceTab === "analytics" && (
              <div className="flex-1 overflow-y-auto">
                <OrbitAnalytics
                  analytics={analytics}
                  className="mx-auto max-w-5xl"
                />
              </div>
            )}
          </motion.div>
        )}

        {viewMode === "full-viz" && (
          <motion.div
            key="full-viz"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FullProjectViz
              ideas={ideas}
              tasks={allTasks}
              hubs={hubs}
              fullscreen={graphFullscreen}
              onToggleFullscreen={() => setGraphFullscreen(!graphFullscreen)}
              onClose={() => setViewMode("workspace")}
            />
          </motion.div>
        )}

        {viewMode === "galaxy" && (
          <motion.div
            key="galaxy"
            className="fixed inset-y-0 right-0 z-50 flex flex-col"
            style={{ left: sidebarCollapsed ? "72px" : "256px" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Floating exit button */}
            <div className="absolute top-4 right-4 z-[60] flex items-center gap-2">
              <button
                onClick={() => setViewMode("workspace")}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
              >
                <span>✕</span>
                <span>Exit Galaxy</span>
              </button>
            </div>
            <GalaxyView
              hubs={hubs}
              ideas={ideas}
              tasks={allTasks}
              project={projects.find((p) => p.id === projectId)}
              onSwitchTo2D={() => setViewMode("workspace")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics overview bar (only on hubs tab) */}
      {analytics && viewMode === "workspace" && workspaceTab === "hubs" && (
        <motion.div
          className="border-border/50 orbit-card-glass mx-auto mt-6 flex w-full max-w-3xl items-center gap-4 rounded-2xl border p-3 sm:p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <OrbitProgressRing
              progress={analytics.projectProgress ?? 0}
              size={48}
              strokeWidth={4}
              color="#3b82f6"
              showPercentage
            />
            <div className="hidden sm:block">
              <p className="text-xs font-medium">Project Progress</p>
              <p className="text-muted-foreground text-[10px]">
                {analytics.completedPercentage ?? 0}% completed
              </p>
            </div>
          </div>

          <div className="bg-border/30 mx-2 hidden h-8 w-px sm:block" />

          <div className="flex flex-1 flex-wrap items-center gap-3 text-[10px] sm:gap-4 sm:text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Velocity:</span>
              <span className="font-medium">{analytics.velocity ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Cycle:</span>
              <span className="font-medium">{analytics.cycleTime ?? 0}d</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Risk:</span>
              <span
                className="font-medium"
                style={{ color: (analytics.riskScore ?? 0) > 5 ? "#ef4444" : "#22c55e" }}
              >
                {analytics.riskScore ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">AI:</span>
              <span className="font-medium">{analytics.aiHealthScore ?? 0}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Team avatars bar */}
      {viewMode === "workspace" && workspaceTab === "hubs" && allMembers.length > 0 && (
        <motion.div
          className="mt-3 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="text-muted-foreground text-[9px] sm:text-[10px]">Team:</span>
          <OrbitTeamAvatars
            members={allMembers}
            max={7}
            size="sm"
          />
        </motion.div>
      )}

      {/* Risk nodes floating indicator */}
      <OrbitRiskNodes
        risks={risks}
        cards={hubs.flatMap((h) => h.cards)}
        onResolve={(riskId) => {
          orbitRisksApi.update(riskId, { status: "resolved" });
        }}
      />

      {/* Search overlay */}
      <OrbitSearch
        ideas={ideas}
        tasks={allTasks}
        hubs={hubs}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Filters panel */}
      <div className="relative">
        <OrbitFilters
          filters={filters}
          onChange={() => {}}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />
      </div>

      {/* AI Panel */}
      <OrbitAIPanel
        hubs={hubs}
        ideas={ideas}
        tasks={allTasks}
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
      />
    </div>
  );
}
