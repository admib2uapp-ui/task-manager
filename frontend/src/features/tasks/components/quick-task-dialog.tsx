"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  KANBAN_COLUMNS,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/config/constants";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useCreateTask } from "@/features/tasks/hooks/use-tasks";
import { TASK_PRIORITY } from "@/types/domain";
import type { TaskPriority, TaskStatus } from "@/types/domain";

interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  defaultStatus?: TaskStatus;
}

export function QuickTaskDialog({
  open,
  onOpenChange,
  projectId,
  defaultStatus = "backlog",
}: QuickTaskDialogProps) {
  const createTask = useCreateTask();
  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError: projectsLoadError,
  } = useProjects({ includeArchived: true });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | undefined>(
    projectId,
  );
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setSelectedProject(projectId);
      setStatus(defaultStatus);
      setPriority("medium");
    }
  }, [open, projectId, defaultStatus]);

  useEffect(() => {
    if (open && !projectId && !selectedProject && projects.length > 0) {
      setSelectedProject(String(projects[0].id));
    }
  }, [open, projectId, selectedProject, projects]);

  async function submit() {
    if (!title.trim() || !selectedProject) return;
    await createTask.mutateAsync({
      projectId: selectedProject,
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Quickly capture a task. You can add more detail later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
            }}
            placeholder="Task title"
            className="h-10"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />

          {!projectId && (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Project</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
                disabled={
                  projectsLoading || projectsLoadError || projects.length === 0
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue
                    placeholder={
                      projectsLoading ? "Loading projects..." : "Select a project"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {projectsLoading && (
                    <SelectItem value="__loading" disabled>
                      Loading projects...
                    </SelectItem>
                  )}
                  {!projectsLoading && projects.length === 0 && (
                    <SelectItem value="__none" disabled>
                      No projects available
                    </SelectItem>
                  )}
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <span
                        className="mr-1.5 inline-block size-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projectsLoadError && (
                <p className="text-destructive text-xs">
                  Could not load projects. Refresh and try again.
                </p>
              )}
              {!projectsLoading && !projectsLoadError && projects.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  No projects found. Create one in{" "}
                  <Link href="/projects" className="underline underline-offset-2">
                    Projects
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {KANBAN_COLUMNS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {Object.values(TASK_PRIORITY).map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => void submit()}
            disabled={!title.trim() || !selectedProject || createTask.isPending}
          >
            {createTask.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
