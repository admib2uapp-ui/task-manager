"use client";

import {
  CalendarClock,
  Check,
  GitBranch,
  Link2,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  KANBAN_COLUMNS,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/config/constants";
import { TagSelector } from "@/features/projects/components/tag-selector";
import { useTaskDetailMutations } from "@/features/tasks/hooks/use-task-detail";
import {
  useDeleteTask,
  useTask,
  useTasks,
  useUpdateTask,
} from "@/features/tasks/hooks/use-tasks";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { formatDateTime, formatDuration, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY } from "@/types/domain";
import type { Task, TaskPriority, TaskStatus } from "@/types/domain";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof MessageSquare;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h4 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        <Icon className="size-3.5" /> {title}
      </h4>
      {children}
    </section>
  );
}

interface TaskDetailSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function TaskDetailSheet({
  taskId,
  open,
  onOpenChange,
  onDeleted,
}: TaskDetailSheetProps) {
  const { data: task, isLoading } = useTask(taskId ?? "", open && !!taskId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="border-border w-full gap-0 p-0 sm:max-w-xl"
      >
        <SheetTitle className="sr-only">Task details</SheetTitle>
        <SheetDescription className="sr-only">
          View and edit task
        </SheetDescription>
        {isLoading || !task ? (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <TaskDetailBody task={task} onDeleted={onDeleted} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TaskDetailBody({
  task,
  onDeleted,
}: {
  task: Task;
  onDeleted?: () => void;
}) {
  const update = useUpdateTask();
  const deleteTask = useDeleteTask();
  const currentUser = useAuthStore((s) => s.user);
  const mutations = useTaskDetailMutations(task.id);
  const { data: projectTasks = [] } = useTasks({ projectId: task.projectId });

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [github, setGithub] = useState({
    githubRepoUrl: task.githubRepoUrl ?? "",
    githubIssueUrl: task.githubIssueUrl ?? "",
    githubPrUrl: task.githubPrUrl ?? "",
    githubBranch: task.githubBranch ?? "",
  });
  const [newSubtask, setNewSubtask] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setGithub({
      githubRepoUrl: task.githubRepoUrl ?? "",
      githubIssueUrl: task.githubIssueUrl ?? "",
      githubPrUrl: task.githubPrUrl ?? "",
      githubBranch: task.githubBranch ?? "",
    });
  }, [task]);

  const patch = (payload: Parameters<typeof update.mutate>[0]["payload"]) =>
    update.mutate({ id: task.id, payload });

  const subtasks = task.subtasks ?? [];
  const checklist = task.checklist ?? [];
  const comments = task.comments ?? [];
  const dependencyIds = task.dependencyIds ?? [];
  const dependencies = projectTasks.filter((t) => dependencyIds.includes(t.id));
  const availableDeps = projectTasks.filter(
    (t) => t.id !== task.id && !dependencyIds.includes(t.id),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {task.project && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: task.project.color }}
              />
              {task.project.name}
            </span>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8 rounded-lg"
              aria-label="Delete task"
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this task?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the task and its subtasks, checklist
                and comments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-white"
                onClick={() =>
                  deleteTask.mutate(task.id, {
                    onSuccess: () => onDeleted?.(),
                  })
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 px-5 py-5">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== task.title && patch({ title })}
            className="placeholder:text-muted-foreground w-full bg-transparent text-xl font-semibold tracking-tight outline-none"
            placeholder="Task title"
          />

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Select
                value={task.status}
                onValueChange={(v) => patch({ status: v as TaskStatus })}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KANBAN_COLUMNS.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span
                        className="mr-1.5 inline-block size-2 rounded-full"
                        style={{ backgroundColor: TASK_STATUS_META[s].color }}
                      />
                      {TASK_STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Priority</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => patch({ priority: v as TaskPriority })}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TASK_PRIORITY).map((p) => (
                    <SelectItem key={p} value={p}>
                      <span
                        className="mr-1.5 inline-block size-2 rounded-full"
                        style={{
                          backgroundColor: TASK_PRIORITY_META[p].color,
                        }}
                      />
                      {TASK_PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline + estimate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Deadline</Label>
              <Input
                type="date"
                className="h-9"
                defaultValue={task.deadline?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  patch({
                    deadline: e.target.value
                      ? `${e.target.value}T00:00:00Z`
                      : null,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">
                Est. hours
              </Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                className="h-9"
                defaultValue={task.estimatedHours ?? ""}
                onBlur={(e) =>
                  patch({
                    estimatedHours: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </div>
          </div>

          {/* Assignee + time */}
          <div className="border-border flex items-center justify-between rounded-xl border px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <UserCircle2 className="text-muted-foreground size-4" />
              {task.assignee ? (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar className="size-5">
                    <AvatarFallback className="bg-primary/15 text-primary text-[9px]">
                      {getInitials(task.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  {task.assignee.name}
                </span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {formatDuration(task.timeSpentSeconds)} tracked
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-lg"
                onClick={() =>
                  patch({
                    assigneeId: task.assignee
                      ? null
                      : (currentUser?.id ?? null),
                  })
                }
              >
                {task.assignee ? "Unassign" : "Assign me"}
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Tags</Label>
            <TagSelector
              selectedIds={task.tags.map((t) => t.id)}
              onChange={(ids) => patch({ tagIds: ids })}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() =>
                description !== (task.description ?? "") &&
                patch({ description: description || null })
              }
              rows={4}
              placeholder="Add more detail…"
            />
          </div>

          {/* Subtasks */}
          <Section title="Subtasks" icon={Check}>
            <div className="space-y-1.5">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-2 rounded-lg px-1 py-0.5"
                >
                  <Checkbox
                    checked={s.completed}
                    onCheckedChange={(c) =>
                      mutations.toggleSubtask.mutate({
                        id: s.id,
                        completed: Boolean(c),
                      })
                    }
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      s.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {s.title}
                  </span>
                  <button
                    onClick={() => mutations.deleteSubtask.mutate(s.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSubtask.trim()) {
                    mutations.addSubtask.mutate(newSubtask.trim());
                    setNewSubtask("");
                  }
                }}
                placeholder="Add subtask…"
                className="h-8"
              />
            </div>
          </Section>

          {/* Checklist */}
          <Section title="Checklist" icon={Check}>
            <div className="space-y-1.5">
              {checklist.map((c) => (
                <div
                  key={c.id}
                  className="group flex items-center gap-2 rounded-lg px-1 py-0.5"
                >
                  <Checkbox
                    checked={c.completed}
                    onCheckedChange={(v) =>
                      mutations.toggleChecklistItem.mutate({
                        id: c.id,
                        completed: Boolean(v),
                      })
                    }
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      c.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {c.content}
                  </span>
                  <button
                    onClick={() => mutations.deleteChecklistItem.mutate(c.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <Input
              value={newChecklist}
              onChange={(e) => setNewChecklist(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newChecklist.trim()) {
                  mutations.addChecklistItem.mutate(newChecklist.trim());
                  setNewChecklist("");
                }
              }}
              placeholder="Add checklist item…"
              className="h-8"
            />
          </Section>

          {/* Dependencies */}
          <Section title="Dependencies" icon={Link2}>
            <div className="space-y-1.5">
              {dependencies.map((d) => (
                <div
                  key={d.id}
                  className="group border-border flex items-center gap-2 rounded-lg border px-2 py-1"
                >
                  <span className="flex-1 truncate text-sm">{d.title}</span>
                  <button
                    onClick={() => mutations.removeDependency.mutate(d.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {availableDeps.length > 0 && (
              <Select
                value=""
                onValueChange={(v) => v && mutations.addDependency.mutate(v)}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="Add dependency…" />
                </SelectTrigger>
                <SelectContent>
                  {availableDeps.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Section>

          {/* GitHub */}
          <Section title="GitHub" icon={GitBranch}>
            <div className="grid gap-2">
              {(
                [
                  ["githubRepoUrl", "Repository URL"],
                  ["githubIssueUrl", "Issue URL"],
                  ["githubPrUrl", "Pull request URL"],
                  ["githubBranch", "Branch name"],
                ] as const
              ).map(([key, label]) => (
                <Input
                  key={key}
                  value={github[key]}
                  placeholder={label}
                  className="h-8"
                  onChange={(e) =>
                    setGithub((g) => ({ ...g, [key]: e.target.value }))
                  }
                  onBlur={() =>
                    github[key] !== (task[key] ?? "") &&
                    patch({ [key]: github[key] || null } as Record<
                      string,
                      string | null
                    >)
                  }
                />
              ))}
            </div>
          </Section>

          {/* Comments */}
          <Section title="Comments" icon={MessageSquare}>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="group flex gap-2.5">
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-primary text-[10px]">
                      {getInitials(c.author?.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted flex-1 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {c.author?.name ?? "Unknown"}
                      </span>
                      <button
                        onClick={() => mutations.deleteComment.mutate(c.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment…"
                rows={2}
                className="min-h-9"
              />
              <Button
                size="icon"
                className="size-9 shrink-0 rounded-xl"
                disabled={!newComment.trim() || mutations.addComment.isPending}
                onClick={() => {
                  mutations.addComment.mutate(newComment.trim());
                  setNewComment("");
                }}
                aria-label="Send comment"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </Section>

          <div className="border-border text-muted-foreground flex items-center gap-4 border-t pt-4 text-xs">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" /> Created{" "}
              {formatDateTime(task.createdAt)}
            </span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
