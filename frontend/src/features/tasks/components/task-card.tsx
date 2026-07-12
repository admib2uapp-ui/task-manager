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
import { formatDate, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/domain";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  dragging?: boolean;
  showProject?: boolean;
}

export function TaskCard({
  task,
  onClick,
  dragging,
  showProject,
}: TaskCardProps) {
  const priority = TASK_PRIORITY_META[task.priority];
  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter((s) => s.completed).length;
  const checklist = task.checklist ?? [];
  const doneChecklist = checklist.filter((c) => c.completed).length;
  const commentCount = task.comments?.length ?? 0;
  const attachmentCount = task.attachments?.length ?? 0;

  const isOverdue =
    task.deadline &&
    task.status !== "done" &&
    new Date(task.deadline).getTime() < Date.now();

  return (
    <div
      onClick={onClick}
      className={cn(
        "group border-border bg-card shadow-soft hover:border-muted-foreground/30 cursor-pointer rounded-xl border p-3 transition-all select-none",
        dragging && "shadow-glow rotate-2 opacity-90",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
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

      <p className="line-clamp-2 text-sm leading-snug font-medium">
        {task.title}
      </p>

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
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

      <div className="text-muted-foreground mt-3 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          {subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListTree className="size-3.5" />
              {doneSubtasks}/{subtasks.length}
            </span>
          )}
          {checklist.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="size-3.5" />
              {doneChecklist}/{checklist.length}
            </span>
          )}
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {commentCount}
            </span>
          )}
          {attachmentCount > 0 && (
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
              {formatDate(task.deadline, "MMM d")}
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
