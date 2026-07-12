"use client";

import { CalendarDays, Clock, Plus, Timer, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManualEntryDialog } from "@/features/time/components/manual-entry-dialog";
import { TimerWidget } from "@/features/time/components/timer-widget";
import {
  useDeleteTimeEntry,
  useTimeEntries,
  useTimeSummary,
} from "@/features/time/hooks/use-time";
import { formatDate, formatDuration } from "@/lib/format";

export function TimeTrackingView() {
  const { data: summary } = useTimeSummary();
  const { data: entries = [] } = useTimeEntries();
  const remove = useDeleteTimeEntry();
  const [manualOpen, setManualOpen] = useState(false);

  const maxSeconds = Math.max(
    1,
    ...(summary?.perProject.map((p) => p.seconds) ?? [1]),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Time Tracking"
        description="Track focused time across projects and tasks."
        actions={
          <Button
            variant="outline"
            className="gap-1.5 rounded-xl"
            onClick={() => setManualOpen(true)}
          >
            <Plus className="size-4" /> Log time
          </Button>
        }
      />

      <TimerWidget />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Today"
          value={formatDuration(summary?.todaySeconds ?? 0)}
          icon={Clock}
          accent="#3b82f6"
        />
        <StatCard
          label="This Week"
          value={formatDuration(summary?.weekSeconds ?? 0)}
          icon={CalendarDays}
          accent="#22c55e"
        />
        <StatCard
          label="Last 30 Days"
          value={formatDuration(summary?.monthSeconds ?? 0)}
          icon={Timer}
          accent="#a855f7"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Time by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {summary && summary.perProject.length > 0 ? (
              <div className="space-y-3">
                {summary.perProject.map((p) => (
                  <div key={p.projectId ?? "none"}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: p.projectColor }}
                        />
                        {p.projectName}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDuration(p.seconds)}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(p.seconds / maxSeconds) * 100}%`,
                          backgroundColor: p.projectColor,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Timer}
                title="No time tracked yet"
                description="Start the timer or log time to see your breakdown."
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length > 0 ? (
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group hover:bg-accent flex items-center gap-3 rounded-xl px-2 py-2"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: entry.projectColor ?? "#71717a",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {entry.taskTitle ||
                          entry.description ||
                          entry.projectName ||
                          "Untitled"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {entry.projectName ?? "No project"} ·{" "}
                        {formatDate(entry.startedAt, "MMM d, h:mm a")}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums">
                      {entry.isRunning
                        ? "running"
                        : formatDuration(entry.durationSeconds)}
                    </span>
                    <button
                      onClick={() => remove.mutate(entry.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No entries yet"
                description="Your tracked sessions will appear here."
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ManualEntryDialog open={manualOpen} onOpenChange={setManualOpen} />
    </PageContainer>
  );
}
