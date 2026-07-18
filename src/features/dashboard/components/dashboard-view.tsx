"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Plus,
  Timer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TASK_PRIORITY_META } from "@/config/constants";
import { getProjectIcon } from "@/config/icons";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { useUIStore } from "@/stores/ui-store";
import {
  formatDeadlineDate,
  formatDuration,
  isDeadlineOverdue,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/domain";

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const priority = TASK_PRIORITY_META[task.priority];
  const overdue = task.status !== "done" && isDeadlineOverdue(task.deadline);
  return (
    <button
      onClick={onClick}
      className="hover:bg-accent flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: priority.color }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{task.title}</span>
        {task.project && (
          <span className="text-muted-foreground block truncate text-xs">
            {task.project.name}
          </span>
        )}
      </span>
      {task.deadline && (
        <span
          className={cn(
            "text-muted-foreground shrink-0 text-xs",
            overdue && "text-danger",
          )}
        >
          {formatDeadlineDate(task.deadline, "MMM d")}
        </span>
      )}
    </button>
  );
}

export function DashboardView() {
  const { data, isLoading } = useDashboard();
  const setQuickCreateOpen = useUIStore((s) => s.setQuickCreateOpen);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function openTask(task: Task) {
    setSelectedTaskId(task.id);
    setDetailOpen(true);
  }

  const stats = data?.stats;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Your workspace at a glance."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-1.5 rounded-xl">
              <Link href="/projects">
                <FolderKanban className="size-4" /> Projects
              </Link>
            </Button>
            <Button
              className="gap-1.5 rounded-xl"
              onClick={() => setQuickCreateOpen(true)}
            >
              <Plus className="size-4" /> New Task
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Due Today"
            value={stats?.dueToday ?? 0}
            icon={CheckCircle2}
            accent="#3b82f6"
            href="/tasks"
          />
          <StatCard
            label="Active Projects"
            value={stats?.activeProjects ?? 0}
            icon={FolderKanban}
            accent="#22c55e"
            href="/projects"
          />
          <StatCard
            label="Overdue"
            value={stats?.overdueTasks ?? 0}
            icon={AlertTriangle}
            accent="#ef4444"
            href="/tasks"
          />
          <StatCard
            label="Tracked Today"
            value={formatDuration(stats?.trackedTodaySeconds ?? 0)}
            icon={Timer}
            accent="#a855f7"
            href="/time-tracking"
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border bg-card shadow-soft rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Tasks Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.todayTasks.length > 0 ? (
                <div className="space-y-0.5">
                  {data.todayTasks.map((t) => (
                    <TaskRow key={t.id} task={t} onClick={() => openTask(t)} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="All clear"
                  description="Nothing due today. Enjoy the focus time."
                  className="border-0 bg-transparent py-8"
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-soft rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.upcomingDeadlines.length > 0 ? (
                <div className="space-y-0.5">
                  {data.upcomingDeadlines.map((t) => (
                    <TaskRow key={t.id} task={t} onClick={() => openTask(t)} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarClock}
                  title="No upcoming deadlines"
                  description="Deadlines in the next 7 days will show up here."
                  className="border-0 bg-transparent py-8"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border bg-card shadow-soft rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="text-success size-4" /> Productivity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-semibold">
                    {stats?.completionRate ?? 0}%
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-success h-full rounded-full transition-all"
                    style={{ width: `${stats?.completionRate ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-muted/50 rounded-xl py-3">
                  <p className="text-xl font-semibold">
                    {stats?.completedTasks ?? 0}
                  </p>
                  <p className="text-muted-foreground text-xs">Completed</p>
                </div>
                <div className="bg-muted/50 rounded-xl py-3">
                  <p className="text-xl font-semibold">
                    {stats?.pendingTasks ?? 0}
                  </p>
                  <p className="text-muted-foreground text-xs">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-soft rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.recentProjects.length > 0 ? (
                <div className="space-y-1">
                  {data.recentProjects.map((p) => {
                    const Icon = getProjectIcon(p.icon);
                    return (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="hover:bg-accent flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
                      >
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-lg"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${p.color} 18%, transparent)`,
                            color: p.color,
                          }}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {p.name}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {p.progress}%
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Create your first project to get started."
                  className="border-0 bg-transparent py-8"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskDetailSheet
        taskId={selectedTaskId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDeleted={() => setDetailOpen(false)}
      />
    </PageContainer>
  );
}
