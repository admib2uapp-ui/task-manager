"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { TASK_PRIORITY_META } from "@/config/constants";
import {
  WEEKDAYS,
  buildMonthGrid,
  dateKey,
  groupTasksByDay,
  nextMonth,
  prevMonth,
} from "@/features/calendar/utils";
import { useTasks, useUpdateTask } from "@/features/tasks/hooks/use-tasks";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/domain";

function TaskChip({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const color = TASK_PRIORITY_META[task.priority].color;
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-xs font-medium transition-colors hover:brightness-110",
        isDragging && "opacity-40",
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="truncate">{task.title}</span>
    </button>
  );
}

function DayCell({
  dayKey,
  children,
  className,
}: {
  dayKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-border flex min-h-28 flex-col gap-1 border-r border-b p-1.5 transition-colors",
        isOver && "bg-primary/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CalendarView() {
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState<"month" | "agenda">("month");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { data: tasks = [] } = useTasks();
  const update = useUpdateTask();
  const setOpenTaskId = useUIStore((s) => s.setOpenTaskId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const days = useMemo(() => buildMonthGrid(month), [month]);
  const byDay = useMemo(() => groupTasksByDay(tasks), [tasks]);

  const agenda = useMemo(() => {
    const withDeadline = tasks
      .filter((t) => t.deadline)
      .sort(
        (a, b) =>
          new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
      );
    const groups = new Map<string, Task[]>();
    for (const t of withDeadline) {
      const key = dateKey(t.deadline!);
      const bucket = groups.get(key);
      if (bucket) bucket.push(t);
      else groups.set(key, [t]);
    }
    return [...groups.entries()];
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    setActiveTask((event.active.data.current?.task as Task) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const targetKey = String(over.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task && dateKey(task.deadline ?? "") !== targetKey) {
      update.mutate({
        id: taskId,
        payload: { deadline: `${targetKey}T00:00:00Z` },
      });
    }
  }

  return (
    <PageContainer fluid className="max-w-6xl">
      <PageHeader
        title="Calendar"
        description="Plan deadlines across the month."
        actions={
          <div className="flex items-center gap-2">
            <div className="border-border flex rounded-xl border p-0.5">
              {(["month", "agenda"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-sm font-medium capitalize transition-colors",
                    view === v
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {view === "month" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {format(month, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => setMonth(prevMonth(month))}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => setMonth(nextMonth(month))}
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="border-border bg-card overflow-hidden rounded-2xl border-t border-l">
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="border-border bg-muted/30 text-muted-foreground border-r border-b px-2 py-1.5 text-xs font-medium"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => (
                <DayCell
                  key={day.key}
                  dayKey={day.key}
                  className={cn(!day.inMonth && "bg-muted/20")}
                >
                  <span
                    className={cn(
                      "mb-0.5 inline-flex size-6 items-center justify-center self-start rounded-full text-xs",
                      day.isToday
                        ? "bg-primary text-primary-foreground font-semibold"
                        : day.inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/50",
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    {(byDay.get(day.key) ?? []).slice(0, 4).map((task) => (
                      <TaskChip
                        key={task.id}
                        task={task}
                        onOpen={() => setOpenTaskId(task.id)}
                      />
                    ))}
                    {(byDay.get(day.key)?.length ?? 0) > 4 && (
                      <span className="text-muted-foreground px-1.5 text-[10px]">
                        +{(byDay.get(day.key)?.length ?? 0) - 4} more
                      </span>
                    )}
                  </div>
                </DayCell>
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-40">
                <TaskChip task={activeTask} onOpen={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : agenda.length > 0 ? (
        <div className="space-y-6">
          {agenda.map(([key, items]) => (
            <div key={key}>
              <h3 className="mb-2 text-sm font-semibold">
                {format(new Date(key), "EEEE, MMMM d")}
              </h3>
              <div className="space-y-1.5">
                {items.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setOpenTaskId(task.id)}
                    className="border-border bg-card hover:border-muted-foreground/30 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          TASK_PRIORITY_META[task.priority].color,
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {task.title}
                    </span>
                    {task.project && (
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {task.project.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarIcon}
          title="Nothing scheduled"
          description="Tasks with deadlines will appear here."
        />
      )}
    </PageContainer>
  );
}
