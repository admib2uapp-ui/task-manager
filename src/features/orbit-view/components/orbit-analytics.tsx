"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  GitBranch,
  Brain,
} from "lucide-react";
import { OrbitProgressRing } from "@/features/orbit-view/components/orbit-progress-ring";
import type { AnalyticsData } from "@/features/orbit-view/types";
import { cn } from "@/lib/utils";

interface OrbitAnalyticsProps {
  analytics: AnalyticsData | null;
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

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: typeof TrendingUp;
  color: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="orbit-card-glass rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
          }}
        >
          <Icon className="size-3.5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[9px] font-medium uppercase tracking-wider">
            {label}
          </p>
          <p className="text-sm font-bold" style={{ color }}>
            {value}
          </p>
        </div>
        {trend && (
          <span className="ml-auto">
            {trend === "up" ? (
              <TrendingUp className="size-3.5 text-success" />
            ) : trend === "down" ? (
              <TrendingDown className="size-3.5 text-danger" />
            ) : null}
          </span>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("orbit-card-glass rounded-xl border p-3", className)}>
      <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <div className="h-48">{children}</div>
    </div>
  );
}

export function OrbitAnalytics({ analytics, className }: OrbitAnalyticsProps) {
  const burndownData = useMemo(() => analytics?.burndown ?? [], [analytics]);

  const cycleTimeData = useMemo(() => {
    if (!analytics?.cycleTime) return [];
    return [
      { name: "Cycle", value: analytics.cycleTime },
      { name: "Lead", value: analytics.leadTime },
    ];
  }, [analytics]);

  const progressData = useMemo(
    () => [
      { name: "Dev", value: analytics?.developmentProgress ?? 0, color: "#3b82f6" },
      { name: "Test", value: analytics?.testingProgress ?? 0, color: "#22c55e" },
      { name: "Review", value: analytics?.reviewProgress ?? 0, color: "#f59e0b" },
      { name: "Done", value: analytics?.completedPercentage ?? 0, color: "#16a34a" },
    ],
    [analytics],
  );

  if (!analytics) {
    return (
      <div className={cn("orbit-card-glass rounded-2xl border p-6 text-center", className)}>
        <p className="text-muted-foreground text-xs">No analytics data available</p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("space-y-3", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Velocity"
          value={analytics.velocity}
          icon={Zap}
          color="#3b82f6"
          trend={analytics.velocity > 0 ? "up" : "neutral"}
        />
        <StatCard
          label="Cycle Time"
          value={`${analytics.cycleTime}d`}
          icon={Clock}
          color="#f59e0b"
          trend={analytics.cycleTime < 7 ? "up" : "down"}
        />
        <StatCard
          label="Risk Score"
          value={analytics.riskScore}
          icon={AlertTriangle}
          color={analytics.riskScore > 5 ? "#ef4444" : "#22c55e"}
          trend={analytics.riskScore > 5 ? "down" : "up"}
        />
        <StatCard
          label="AI Health"
          value={`${analytics.aiHealthScore}%`}
          icon={Brain}
          color="#a855f7"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Progress by stage */}
        <ChartCard title="Progress by Stage" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={40} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => `${v}%`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {progressData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Completion rate */}
        <ChartCard title="Completion Rate">
          <div className="flex h-full items-center justify-center">
            <OrbitProgressRing
              progress={analytics.completedPercentage}
              size={120}
              strokeWidth={8}
              color="#22c55e"
            />
          </div>
        </ChartCard>

        {/* GitHub Health */}
        <ChartCard title="Health Scores">
          <div className="flex h-full flex-col justify-center gap-3 px-4">
            <div className="flex items-center gap-3">
              <GitBranch className="text-muted-foreground size-4" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px]">
                  <span>GitHub</span>
                  <span className="font-medium">{analytics.githubHealthScore}%</span>
                </div>
                <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${analytics.githubHealthScore}%`,
                      backgroundColor: analytics.githubHealthScore > 70 ? "#22c55e" : "#f59e0b",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Brain className="text-muted-foreground size-4" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px]">
                  <span>AI</span>
                  <span className="font-medium">{analytics.aiHealthScore}%</span>
                </div>
                <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${analytics.aiHealthScore}%`,
                      backgroundColor: analytics.aiHealthScore > 70 ? "#22c55e" : "#f59e0b",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="text-muted-foreground size-4" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px]">
                  <span>Productivity</span>
                  <span className="font-medium">{analytics.teamProductivity}%</span>
                </div>
                <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${analytics.teamProductivity}%`,
                      backgroundColor: analytics.teamProductivity > 70 ? "#3b82f6" : "#f59e0b",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Burndown */}
        <ChartCard title="Burndown" className="sm:col-span-2 lg:col-span-3">
          {burndownData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burndownData}>
                <defs>
                  <linearGradient id="burndownIdeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="burndownActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
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
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#burndownActual)"
                  dot={{ r: 3, fill: "#22c55e" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground/50 text-[10px]">No burndown data yet</p>
            </div>
          )}
        </ChartCard>
      </div>
    </motion.div>
  );
}
