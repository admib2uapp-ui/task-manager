"use client";

import { CalendarClock, Flag, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  useCreateMilestone,
  useDeleteMilestone,
  useMilestones,
  useUpdateMilestone,
} from "@/features/projects/hooks/use-milestones";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MilestonesList({ projectId }: { projectId: string }) {
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const create = useCreateMilestone(projectId);
  const update = useUpdateMilestone(projectId);
  const remove = useDeleteMilestone(projectId);

  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function handleAdd() {
    if (!name.trim()) return;
    await create.mutateAsync({
      name: name.trim(),
      dueDate: dueDate ? `${dueDate}T00:00:00Z` : null,
    });
    setName("");
    setDueDate("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="Add a milestone…"
          className="h-10 flex-1"
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-10 w-40"
          />
          <Button
            className="h-10 gap-1.5 rounded-xl"
            onClick={() => void handleAdd()}
            disabled={!name.trim() || create.isPending}
          >
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex justify-center py-8">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : milestones.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No milestones yet"
          description="Break your project into milestones to track progress."
          className="py-10"
        />
      ) : (
        <ul className="divide-border border-border divide-y overflow-hidden rounded-xl border">
          {milestones.map((milestone) => (
            <li
              key={milestone.id}
              className="group bg-card flex items-center gap-3 px-4 py-3"
            >
              <Checkbox
                checked={milestone.completed}
                onCheckedChange={(checked) =>
                  update.mutate({
                    milestoneId: milestone.id,
                    payload: { completed: Boolean(checked) },
                  })
                }
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    milestone.completed && "text-muted-foreground line-through",
                  )}
                >
                  {milestone.name}
                </p>
                {milestone.dueDate && (
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                    <CalendarClock className="size-3" />
                    {formatDate(milestone.dueDate)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => remove.mutate(milestone.id)}
                aria-label="Delete milestone"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
