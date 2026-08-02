"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { OrbitSprint } from "@/features/orbit-view/types";
import type { Task } from "@/types/domain";

interface SprintBurndownProps {
  sprint: OrbitSprint;
  tasks: Task[];
  className?: string;
}

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "var(--foreground)",
  padding: "8px 12px",
};

export function SprintBurndown({ sprint, tasks, className }: SprintBurndownProps) {
  const burndownData = useMemo(() => {
    const sprintTasks = sprint.tasks ?? [];
    const totalPoints = sprintTasks.reduce((s, t) => s + t.storyPoints, 0);
    if (totalPoints === 0) return [];

    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const today = new Date();
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / 86400000));

    const donePoints = sprintTasks
      .filter((st) => tasks.find((t) => t.id === st.taskId)?.status === "done")
      .reduce((s, t) => s + t.storyPoints, 0);

    const data: Array<{ day: number; ideal: number; actual: number | null }> = [];

    for (let d = 0; d <= totalDays; d++) {
      const idealRemaining = Math.max(0, totalPoints - (totalPoints / totalDays) * d);
      const actualRemaining = d <= daysElapsed ? totalPoints - (donePoints / Math.max(1, daysElapsed)) * Math.min(d, daysElapsed) : null;

      data.push({
        day: d,
        ideal: Math.round(idealRemaining * 10) / 10,
        actual: actualRemaining !== null ? Math.max(0, Math.round(actualRemaining * 10) / 10) : null,
      });
    }

    return data;
  }, [sprint, tasks]);

  if (burndownData.length === 0) {
    return (
      <div className={cn("orbit-card-glass rounded-xl border p-6 text-center", className)}>
        <p className="text-muted-foreground/50 text-xs">No burndown data available</p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("orbit-card-glass rounded-xl border p-3 sm:p-4", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h4 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Sprint Burndown
      </h4>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={burndownData}>
            <defs>
              <linearGradient id="burndownIdeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="burndownActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              label={{ value: "Days", position: "insideBottom", offset: -4, fontSize: 9, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={30}
              label={{ value: "Points", angle: -90, position: "insideLeft", offset: 0, fontSize: 9, fill: "var(--muted-foreground)" }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="ideal"
              name="Ideal"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="url(#burndownIdeal)"
              dot={false}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#burndownActual)"
              dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 text-[9px] text-muted-foreground sm:gap-6 sm:text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border-2 border-dashed" style={{ borderColor: "#3b82f6" }} />
          Ideal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#22c55e]" />
          Actual
        </span>
      </div>
    </motion.div>
  );
}
