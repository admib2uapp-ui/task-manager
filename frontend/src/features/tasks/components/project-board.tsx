"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { KanbanBoard } from "@/features/tasks/components/kanban-board";
import { QuickTaskDialog } from "@/features/tasks/components/quick-task-dialog";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import type { Task, TaskStatus } from "@/types/domain";

export function ProjectBoard({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading } = useTasks({ projectId });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickStatus, setQuickStatus] = useState<TaskStatus>("backlog");

  function openTask(task: Task) {
    setSelectedTaskId(task.id);
    setDetailOpen(true);
  }

  function addTask(status: TaskStatus) {
    setQuickStatus(status);
    setQuickOpen(true);
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex justify-center py-16">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-19rem)] min-h-[420px]">
      <KanbanBoard
        projectId={projectId}
        tasks={tasks ?? []}
        onOpenTask={openTask}
        onAddTask={addTask}
      />

      <TaskDetailSheet
        taskId={selectedTaskId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDeleted={() => setDetailOpen(false)}
      />

      <QuickTaskDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        projectId={projectId}
        defaultStatus={quickStatus}
      />
    </div>
  );
}
