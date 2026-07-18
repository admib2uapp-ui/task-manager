"use client";

import {
  CalendarClock,
  CheckSquare,
  GitBranch,
  ListTree,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TASK_PRIORITY_META } from "@/config/constants";
import {
  formatDeadlineDate,
  getInitials,
  isDeadlineOverdue,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/domain";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  dragging?: boolean;
  showProject?: boolean;
  density?: "default" | "compact" | "tight";
  fillHeight?: boolean;
}

export function TaskCard({
  task,
  onClick,
  dragging,
  showProject,
  density = "default",
  fillHeight = false,
}: TaskCardProps) {
  const compact = density !== "default";
  const tight = density === "tight";
  const priority = TASK_PRIORITY_META[task.priority];
  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter((s) => s.completed).length;
  const checklist = task.checklist ?? [];
  const doneChecklist = checklist.filter((c) => c.completed).length;
  const commentCount = task.comments?.length ?? 0;
  const attachmentCount = task.attachments?.length ?? 0;

  const isOverdue = task.status !== "done" && isDeadlineOverdue(task.deadline);

  if (tight) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "group border-border bg-card shadow-soft hover:border-muted-foreground/30 cursor-pointer rounded-xl border overflow-hidden transition-all select-none",
          "min-h-0 p-1",
          fillHeight && "h-full",
          dragging && "shadow-glow rotate-2 opacity-90",
        )}
      >
        <div className="flex h-full min-w-0 items-center gap-1.5">
          <span
            className="rounded px-1 py-0.5 text-[8px] font-semibold tracking-wide uppercase"
            style={{
              backgroundColor: `color-mix(in srgb, ${priority.color} 16%, transparent)`,
              color: priority.color,
            }}
          >
            {priority.label}
          </span>

          <p className="flex-1 truncate text-[11px] leading-tight font-medium">
            {task.title}
          </p>

          {task.deadline && (
            <CalendarClock
              className={cn("size-3 shrink-0", isOverdue && "text-danger")}
            />
          )}

          {task.assignee && (
            <Avatar className="size-4 shrink-0">
              {task.assignee.avatarUrl && (
                <AvatarImage src={task.assignee.avatarUrl} />
              )}
              <AvatarFallback className="bg-primary/15 text-primary text-[8px]">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group border-border bg-card shadow-soft hover:border-muted-foreground/30 cursor-pointer rounded-xl border overflow-hidden transition-all select-none",
        tight ? "min-h-0 p-1.5" : compact ? "min-h-0 p-2" : "min-h-[120px] p-3",
        fillHeight && "h-full",
        dragging && "shadow-glow rotate-2 opacity-90",
      )}
    >
      <div className={cn("flex items-center gap-2", compact ? "mb-1" : "mb-2")}>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-semibold tracking-wide uppercase",
            tight ? "text-[9px]" : "text-[10px]",
          )}
          style={{
            backgroundColor: `color-mix(in srgb, ${priority.color} 16%, transparent)`,
            color: priority.color,
          }}
        >
          {priority.label}
        </span>
        {showProject && task.project && (
          <span className="text-muted-foreground inline-flex items-center gap-1 truncate text-[11px]">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: task.project.color }}
            />
            {task.project.name}
          </span>
        )}
      </div>

      <p className={cn("leading-snug font-medium", tight ? "line-clamp-1 text-xs" : compact ? "line-clamp-2 text-xs" : "line-clamp-2 text-sm")}>
        {task.title}
      </p>

      {!tight && task.tags.length > 0 && (
        <div className={cn("flex flex-wrap gap-1", compact ? "mt-1" : "mt-2")}>
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${tag.color} 16%, transparent)`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div
        className={cn(
          "text-muted-foreground flex items-center justify-between gap-2 text-xs",
          tight ? "mt-0.5" : compact ? "mt-1" : "mt-3",
        )}
      >
        <div className="flex items-center gap-2.5">
          {!tight && subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListTree className="size-3.5" />
              {doneSubtasks}/{subtasks.length}
            </span>
          )}
          {!tight && checklist.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="size-3.5" />
              {doneChecklist}/{checklist.length}
            </span>
          )}
          {!tight && commentCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {commentCount}
            </span>
          )}
          {!tight && attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3.5" />
              {attachmentCount}
            </span>
          )}
          {task.githubBranch && <GitBranch className="size-3.5" />}
        </div>

        <div className="flex items-center gap-2">
          {task.deadline && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                isOverdue && "text-danger",
              )}
            >
              <CalendarClock className="size-3.5" />
              {!tight && formatDeadlineDate(task.deadline, "MMM d")}
            </span>
          )}
          {task.assignee && (
            <Avatar className="size-5">
              {task.assignee.avatarUrl && (
                <AvatarImage src={task.assignee.avatarUrl} />
              )}
              <AvatarFallback className="bg-primary/15 text-primary text-[9px]">
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
