"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Calendar,
  TrendingUp,
  Users,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrbitSprint } from "@/features/orbit-view/types";
import type { Task } from "@/types/domain";
import { formatOrbitDate } from "@/features/orbit-view/lib/utils";

interface SprintViewProps {
  sprints: OrbitSprint[];
  tasks: Task[];
  currentSprintId?: string;
  onCreateSprint?: () => void;
  onSprintChange?: (sprintId: string) => void;
  onAddTask?: (sprintId: string) => void;
}

export function SprintView({
  sprints,
  tasks,
  currentSprintId,
  onCreateSprint,
  onSprintChange,
  onAddTask,
}: SprintViewProps) {
  const currentSprint = sprints.find((s) => s.id === currentSprintId) ?? sprints[0];

  const sprintProgress = useMemo(() => {
    if (!currentSprint) return 0;
    const sprintTasks = currentSprint.tasks ?? [];
    if (sprintTasks.length === 0) return 0;
    const done = sprintTasks.filter((st) => {
      const task = tasks.find((t) => t.id === st.taskId);
      return task?.status === "done";
    }).length;
    return Math.round((done / sprintTasks.length) * 100);
  }, [currentSprint, tasks]);

  const developerPoints = useMemo(() => {
    if (!currentSprint) return [];
    const sprintTasks = currentSprint.tasks ?? [];
    const pointsByUser: Record<string, { name: string; avatar: string | null; points: number; done: number }> = {};

    sprintTasks.forEach((st) => {
      const task = tasks.find((t) => t.id === st.taskId);
      if (!task?.assignee) return;
      const id = task.assignee.id;
      if (!pointsByUser[id]) {
        pointsByUser[id] = {
          name: task.assignee.name,
          avatar: task.assignee.avatarUrl,
          points: 0,
          done: 0,
        };
      }
      pointsByUser[id].points += st.storyPoints;
      if (task.status === "done") {
        pointsByUser[id].done += st.storyPoints;
      }
    });

    return Object.entries(pointsByUser)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.points - a.points);
  }, [currentSprint, tasks]);

  if (!currentSprint) {
    return (
      <div className="orbit-card-glass flex flex-col items-center justify-center rounded-2xl border p-12">
        <Target className="text-muted-foreground/50 mb-3 size-10" />
        <p className="text-muted-foreground mb-3 text-sm">No active sprints</p>
        {onCreateSprint && (
          <Button onClick={onCreateSprint} size="sm" className="rounded-xl">
            <Plus className="mr-1 size-3.5" /> Create Sprint
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Sprint header */}
      <div className="orbit-card-glass rounded-2xl border p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold sm:text-lg">{currentSprint.name}</h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-medium",
                  currentSprint.status === "active"
                    ? "bg-success/15 text-success"
                    : currentSprint.status === "completed"
                      ? "bg-muted text-muted-foreground"
                      : "bg-warning/15 text-warning",
                )}
              >
                {currentSprint.status}
              </span>
            </div>
            {currentSprint.goal && (
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                🎯 {currentSprint.goal}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground sm:text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatOrbitDate(currentSprint.startDate)} — {formatOrbitDate(currentSprint.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="size-3" />
                Velocity: {currentSprint.velocity}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {developerPoints.length} developers
              </span>
            </div>
          </div>

          {/* Sprint selector */}
          {sprints.length > 1 && (
            <select
              value={currentSprint.id}
              onChange={(e) => onSprintChange?.(e.target.value)}
              className="bg-muted text-muted-foreground rounded-lg border-0 px-2 py-1 text-[10px] font-medium sm:text-xs"
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Main progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Sprint Progress</span>
            <span className="font-bold" style={{ color: sprintProgress >= 80 ? "#22c55e" : "#3b82f6" }}>
              {sprintProgress}%
            </span>
          </div>
          <div className="bg-muted mt-1.5 h-2.5 overflow-hidden rounded-full">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: sprintProgress >= 80
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #3b82f6, #06b6d4)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${sprintProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-muted/30 rounded-xl p-2.5 text-center">
            <p className="text-muted-foreground text-[9px] font-medium uppercase tracking-wider">
              Total Points
            </p>
            <p className="mt-0.5 text-lg font-bold">
              {currentSprint.tasks?.reduce((s, t) => s + t.storyPoints, 0) ?? 0}
            </p>
          </div>
          <div className="bg-muted/30 rounded-xl p-2.5 text-center">
            <p className="text-muted-foreground text-[9px] font-medium uppercase tracking-wider">
              Completed
            </p>
            <p className="mt-0.5 text-lg font-bold text-success">
              {currentSprint.tasks
                ?.filter((st) => tasks.find((t) => t.id === st.taskId)?.status === "done")
                .reduce((s, t) => s + t.storyPoints, 0) ?? 0}
            </p>
          </div>
          <div className="bg-muted/30 rounded-xl p-2.5 text-center">
            <p className="text-muted-foreground text-[9px] font-medium uppercase tracking-wider">
              Remaining
            </p>
            <p className="mt-0.5 text-lg font-bold text-warning">
              {currentSprint.tasks
                ?.filter((st) => tasks.find((t) => t.id === st.taskId)?.status !== "done")
                .reduce((s, t) => s + t.storyPoints, 0) ?? 0}
            </p>
          </div>
          <div className="bg-muted/30 rounded-xl p-2.5 text-center">
            <p className="text-muted-foreground text-[9px] font-medium uppercase tracking-wider">
              Velocity
            </p>
            <p className="mt-0.5 text-lg font-bold text-primary">
              {currentSprint.velocity}
            </p>
          </div>
        </div>
      </div>

      {/* Developer breakdown */}
      <div className="orbit-card-glass rounded-2xl border p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold sm:text-sm">Developer Workload</h3>
          <Button
            onClick={() => onAddTask?.(currentSprint.id)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 rounded-lg px-2 text-[10px]"
          >
            <Plus className="mr-1 size-3" /> Add Task
          </Button>
        </div>

        <div className="space-y-2">
          {developerPoints.map((dev) => {
            const pct = dev.points > 0 ? Math.round((dev.done / dev.points) * 100) : 0;
            return (
              <div key={dev.id} className="flex items-center gap-3">
                <Avatar className="size-7 shrink-0 border border-border">
                  <AvatarImage src={dev.avatar ?? undefined} />
                  <AvatarFallback className="text-[9px]">{getInitials(dev.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="font-medium truncate">{dev.name}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      {dev.done}/{dev.points} pts
                    </span>
                  </div>
                  <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: pct >= 80 ? "#22c55e" : "#3b82f6" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-medium",
                    pct >= 100 ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {pct}%
                </span>
              </div>
            );
          })}

          {developerPoints.length === 0 && (
            <p className="text-muted-foreground/50 py-6 text-center text-[10px]">
              No tasks assigned in this sprint
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
