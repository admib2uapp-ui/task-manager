"use client";

import { Loader2 } from "lucide-react";
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
  const { data: projects = [] } = useProjects();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState(projectId ?? "");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setSelectedProject(projectId ?? projects[0]?.id ?? "");
      setStatus(defaultStatus);
      setPriority("medium");
    }
  }, [open, projectId, defaultStatus, projects]);

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
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span
                        className="mr-1.5 inline-block size-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <SelectContent>
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
                <SelectContent>
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
