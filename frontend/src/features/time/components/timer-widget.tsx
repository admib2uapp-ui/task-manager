"use client";

import { Loader2, Play, Square, Timer as TimerIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import {
  useRunningTimer,
  useStartTimer,
  useStopTimer,
} from "@/features/time/hooks/use-time";
import { formatClock } from "@/lib/format";

function useElapsedSeconds(startedAt: string | null): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

export function TimerWidget() {
  const { data: running } = useRunningTimer();
  const start = useStartTimer();
  const stop = useStopTimer();
  const { data: projects = [] } = useProjects();

  const [projectId, setProjectId] = useState<string>("none");
  const [taskId, setTaskId] = useState<string>("none");
  const [description, setDescription] = useState("");

  const { data: projectTasks = [] } = useTasks(
    projectId !== "none" ? { projectId } : undefined,
  );

  const elapsed = useElapsedSeconds(running?.startedAt ?? null);

  if (running) {
    return (
      <Card className="border-primary/30 bg-card shadow-soft rounded-2xl">
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="bg-primary/15 text-primary grid size-12 place-items-center rounded-2xl">
              <TimerIcon className="size-6 animate-pulse" />
            </span>
            <div>
              <p className="font-mono text-3xl font-semibold tabular-nums">
                {formatClock(elapsed)}
              </p>
              <p className="text-muted-foreground text-sm">
                {running.taskTitle ||
                  running.projectName ||
                  running.description ||
                  "Tracking time…"}
              </p>
            </div>
          </div>
          <Button
            size="lg"
            variant="destructive"
            className="gap-2 rounded-xl"
            onClick={() => stop.mutate()}
            disabled={stop.isPending}
          >
            {stop.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Square className="size-4 fill-current" />
            )}
            Stop
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-soft rounded-2xl">
      <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          className="h-10 flex-1"
        />
        <Select
          value={projectId}
          onValueChange={(v) => {
            setProjectId(v);
            setTaskId("none");
          }}
        >
          <SelectTrigger className="h-10 lg:w-44">
            <SelectValue placeholder="Project" />
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
        <Select
          value={taskId}
          onValueChange={setTaskId}
          disabled={projectId === "none" || projectTasks.length === 0}
        >
          <SelectTrigger className="h-10 lg:w-44">
            <SelectValue placeholder="Task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No task</SelectItem>
            {projectTasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="lg"
          className="gap-2 rounded-xl"
          disabled={start.isPending}
          onClick={() =>
            start.mutate({
              projectId: projectId === "none" ? null : projectId,
              taskId: taskId === "none" ? null : taskId,
              description: description.trim() || null,
            })
          }
        >
          {start.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
          Start
        </Button>
      </CardContent>
    </Card>
  );
}
