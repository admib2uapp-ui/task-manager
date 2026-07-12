"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useCreateManualEntry } from "@/features/time/hooks/use-time";

interface ManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function nowLocalInput(offsetMinutes = 0): string {
  const d = new Date(Date.now() - offsetMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ManualEntryDialog({
  open,
  onOpenChange,
}: ManualEntryDialogProps) {
  const create = useCreateManualEntry();
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState("none");
  const [description, setDescription] = useState("");
  const [startedAt, setStartedAt] = useState(nowLocalInput(60));
  const [endedAt, setEndedAt] = useState(nowLocalInput(0));

  async function submit() {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    if (end <= start) return;
    await create.mutateAsync({
      projectId: projectId === "none" ? null : projectId,
      description: description.trim() || null,
      startedAt: start.toISOString(),
      endedAt: end.toISOString(),
    });
    onOpenChange(false);
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log time manually</DialogTitle>
          <DialogDescription>
            Add a completed time entry to a project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="h-10"
          />
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Start</Label>
              <Input
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">End</Label>
              <Input
                type="datetime-local"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => void submit()}
            disabled={create.isPending}
          >
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Log time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
