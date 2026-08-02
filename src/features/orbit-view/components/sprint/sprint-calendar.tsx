"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { OrbitSprint } from "@/features/orbit-view/types";
import type { Task } from "@/types/domain";


interface SprintCalendarProps {
  sprint: OrbitSprint;
  tasks: Task[];
  className?: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SprintCalendar({ sprint, tasks, className }: SprintCalendarProps) {
  const calendarData = useMemo(() => {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const days: Array<{
      date: Date;
      dayName: string;
      dayNum: number;
      isToday: boolean;
      isWeekend: boolean;
      isSprintDay: boolean;
      tasks: Task[];
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sprintTasks = sprint.tasks ?? [];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    // Generate 2 weeks of calendar around the sprint
    const calStart = new Date(start);
    calStart.setDate(calStart.getDate() - calStart.getDay());
    const calEnd = new Date(calStart);
    calEnd.setDate(calEnd.getDate() + 13);

    const current = new Date(calStart);
    while (current <= calEnd) {
      const dateStr = current.toISOString().split("T")[0];
      const dayTasks = sprintTasks
        .map((st) => taskMap.get(st.taskId))
        .filter((t): t is Task => {
          if (!t) return false;
          const created = new Date(t.createdAt).toISOString().split("T")[0];
          return created === dateStr || t.deadline === dateStr;
        });

      days.push({
        date: new Date(current),
        dayName: DAY_NAMES[current.getDay()],
        dayNum: current.getDate(),
        isToday: current.getTime() === today.getTime(),
        isWeekend: current.getDay() === 0 || current.getDay() === 6,
        isSprintDay: current >= start && current <= end,
        tasks: dayTasks,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [sprint, tasks]);

  return (
    <motion.div
      className={cn("orbit-card-glass rounded-2xl border p-3 sm:p-4", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h4 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Sprint Calendar
      </h4>

      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-muted-foreground/60 py-1 text-center text-[8px] font-medium sm:text-[10px]"
          >
            {name}
          </div>
        ))}

        {/* Days */}
        {calendarData.map((day, i) => (
          <div
            key={i}
            className={cn(
              "relative flex min-h-[48px] flex-col items-center rounded-lg p-1 text-[9px] transition-colors sm:min-h-[60px] sm:text-[10px]",
              day.isSprintDay
                ? day.isToday
                  ? "bg-primary/10 border-primary/30 border"
                  : "bg-muted/20"
                : "opacity-30",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full sm:size-6",
                day.isToday && "bg-primary text-primary-foreground size-5 font-bold sm:size-6",
              )}
            >
              {day.dayNum}
            </span>

            {/* Task dots */}
            {day.tasks.length > 0 && (
              <div className="mt-auto flex flex-wrap justify-center gap-0.5">
                {day.tasks.slice(0, 3).map((task) => (
                  <span
                    key={task.id}
                    className="size-1.5 rounded-full sm:size-2"
                    style={{
                      backgroundColor:
                        task.status === "done"
                          ? "#22c55e"
                          : task.status === "review"
                            ? "#f59e0b"
                            : "#3b82f6",
                    }}
                  />
                ))}
                {day.tasks.length > 3 && (
                  <span className="text-muted-foreground text-[7px]">
                    +{day.tasks.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-3 text-[9px] text-muted-foreground sm:gap-4">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#3b82f6]" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#f59e0b]" /> Review
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#22c55e]" /> Done
        </span>
      </div>
    </motion.div>
  );
}
