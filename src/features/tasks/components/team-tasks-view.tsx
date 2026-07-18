"use client";

import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KANBAN_COLUMNS,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/config/constants";
import { TaskCard } from "@/features/tasks/components/task-card";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { TASK_PRIORITY } from "@/types/domain";
import type { Task, TaskPriority } from "@/types/domain";

export function TeamTasksView() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: tasks, isLoading } = useTasks({
    search: debouncedSearch || undefined,
    priority: priority === "all" ? undefined : priority,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const status of KANBAN_COLUMNS) map.set(status, []);
    for (const task of tasks ?? []) map.get(task.status)?.push(task);
    return map;
  }, [tasks]);

  function openTask(task: Task) {
    setSelectedTaskId(task.id);
    setDetailOpen(true);
  }

  const hasTasks = (tasks?.length ?? 0) > 0;

  function getDensity(taskCount: number): "default" | "compact" | "tight" {
    if (taskCount >= 5) return "tight";
    if (taskCount >= 3) return "compact";
    return "default";
  }

  return (
    <PageContainer
      fluid
      className="flex h-full min-h-0 flex-col overflow-hidden py-2"
    >
      <PageHeader
        title="Team Tasks"
        description="Overview of everyone's tasks across all projects."
        className="mb-3"
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={priority}
          onValueChange={(v) => setPriority(v as TaskPriority | "all")}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {Object.values(TASK_PRIORITY).map((p) => (
              <SelectItem key={p} value={p}>
                {TASK_PRIORITY_META[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : hasTasks ? (
        <div className="grid min-h-0 flex-1 grid-cols-5 gap-3 pb-1">
          {KANBAN_COLUMNS.map((status) => {
            const items = grouped.get(status) ?? [];
            const meta = TASK_STATUS_META[status];
            const density = getDensity(items.length);
            return (
              <section
                key={status}
                className="border-border bg-card/40 flex h-full min-w-0 flex-col rounded-2xl border"
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <h2 className="text-sm font-semibold">{meta.label}</h2>
                  <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs font-medium">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden px-1.5 pb-1">
                  {items.length > 0 ? (
                    <div
                      className="grid h-full gap-1"
                      style={{
                        gridTemplateRows: `repeat(${items.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {items.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          showProject={density === "default"}
                          density={density}
                          fillHeight
                          onClick={() => openTask(task)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border-border text-muted-foreground flex items-center justify-center rounded-xl border border-dashed py-6 text-xs">
                      No tasks
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No team tasks yet"
          description="Create tasks and assign them to team members to see them here."
        />
      )}

      <TaskDetailSheet
        taskId={selectedTaskId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDeleted={() => setDetailOpen(false)}
      />
    </PageContainer>
  );
}
