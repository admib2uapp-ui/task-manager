"use client";

import { format, parseISO } from "date-fns";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TASK_PRIORITY_META, TASK_STATUS_META } from "@/config/constants";
import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { TaskPriority, TaskStatus } from "@/types/domain";

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "var(--foreground)",
};

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BarChart3;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card shadow-soft rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="text-muted-foreground size-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">{children}</CardContent>
    </Card>
  );
}

export function AnalyticsView() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageHeader title="Analytics" description="Productivity insights." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      </PageContainer>
    );
  }

  const completedData = data.completedPerDay.map((p) => ({
    date: format(parseISO(p.date), "MMM d"),
    value: p.value,
  }));
  const hoursData = data.hoursPerDay.map((p) => ({
    date: format(parseISO(p.date), "MMM d"),
    hours: Math.round((p.value / 3600) * 10) / 10,
  }));
  const statusData = data.statusDistribution.map((s) => ({
    name: TASK_STATUS_META[s.label as TaskStatus]?.label ?? s.label,
    value: s.count,
    color: TASK_STATUS_META[s.label as TaskStatus]?.color ?? "#71717a",
  }));
  const priorityData = data.priorityDistribution.map((p) => ({
    name: TASK_PRIORITY_META[p.label as TaskPriority]?.label ?? p.label,
    value: p.count,
    color: TASK_PRIORITY_META[p.label as TaskPriority]?.color ?? "#71717a",
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Productivity, velocity and completion insights."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completion Rate"
          value={`${data.completionRate}%`}
          icon={TrendingUp}
          accent="#22c55e"
        />
        <StatCard
          label="Completed"
          value={data.completedTasks}
          icon={CheckCircle2}
          accent="#3b82f6"
        />
        <StatCard
          label="Pending"
          value={data.pendingTasks}
          icon={ListTodo}
          accent="#f59e0b"
        />
        <StatCard
          label="Avg. Completion"
          value={`${data.avgCompletionHours}h`}
          icon={Clock}
          accent="#a855f7"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Tasks Completed (14 days)" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={completedData}>
              <defs>
                <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="value"
                name="Completed"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#completed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hours Worked (14 days)" icon={Clock}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hoursData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="hours"
                name="Hours"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tasks by Status" icon={BarChart3}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical">
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tasks by Priority" icon={ListTodo}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </PageContainer>
  );
}
