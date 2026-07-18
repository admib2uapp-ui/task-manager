"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "@/features/tasks/components/task-card";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/domain";

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
  density?: "default" | "compact" | "tight";
  fillHeight?: boolean;
}

export function SortableTaskCard({
  task,
  onClick,
  density,
  fillHeight,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", status: task.status } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        density={density}
        fillHeight={fillHeight}
        onClick={onClick}
      />
    </div>
  );
}
