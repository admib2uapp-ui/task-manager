"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TASK_STATUS_META } from "@/config/constants";
import { SortableTaskCard } from "@/features/tasks/components/sortable-task-card";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/domain";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAdd: (status: TaskStatus) => void;
  onOpenTask: (task: Task) => void;
}

export function KanbanColumn({
  status,
  tasks,
  collapsed,
  onToggleCollapse,
  onAdd,
  onOpenTask,
}: KanbanColumnProps) {
  function getDensity(taskCount: number): "default" | "compact" | "tight" {
    if (taskCount >= 5) return "tight";
    if (taskCount >= 3) return "compact";
    return "default";
  }

  const meta = TASK_STATUS_META[status];
  const density = getDensity(tasks.length);
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  return (
    <div
      className={cn(
        "border-border bg-card/40 flex h-full min-w-0 flex-col rounded-2xl border transition-colors",
        collapsed ? "w-14" : "w-full",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <div
        className={cn("flex items-center gap-2 p-3", collapsed && "flex-col")}
      >
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            className="flex flex-1 flex-col items-center gap-2 [writing-mode:vertical-rl]"
          >
            <span className="text-sm font-medium">{meta.label}</span>
            <span className="text-muted-foreground text-xs">
              {tasks.length}
            </span>
          </button>
        ) : (
          <>
            <h3 className="text-sm font-semibold">{meta.label}</h3>
            <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs font-medium">
              {tasks.length}
            </span>
            <div className="ml-auto flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-7 rounded-lg"
                onClick={() => onAdd(status)}
                aria-label={`Add task to ${meta.label}`}
              >
                <Plus className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-7 rounded-lg"
                onClick={onToggleCollapse}
                aria-label="Collapse column"
              >
                <ChevronDown className="size-4 -rotate-90" />
              </Button>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className="flex-1 overflow-hidden px-1.5 pb-1"
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.length > 0 ? (
              <div
                className="grid h-full gap-1"
                style={{
                  gridTemplateRows: `repeat(${tasks.length}, minmax(0, 1fr))`,
                }}
              >
                {tasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    density={density}
                    fillHeight
                    onClick={() => onOpenTask(task)}
                  />
                ))}
              </div>
            ) : null}
          </SortableContext>

          {tasks.length === 0 && (
            <button
              onClick={() => onAdd(status)}
              className="border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-6 text-xs transition-colors"
            >
              <Plus className="size-3.5" /> Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
