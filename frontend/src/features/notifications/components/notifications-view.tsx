"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AppNotification,
  NotificationType,
} from "@/features/notifications/api/notifications-api";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@/features/notifications/hooks/use-notifications";
import { useUIStore } from "@/stores/ui-store";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const META: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  overdue: { icon: AlertTriangle, color: "#ef4444" },
  deadline: { icon: CalendarClock, color: "#f59e0b" },
  comment: { icon: MessageSquare, color: "#3b82f6" },
  assigned: { icon: UserPlus, color: "#a855f7" },
  reminder: { icon: Bell, color: "#71717a" },
  completed: { icon: CheckCircle2, color: "#22c55e" },
};

export function NotificationsView() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const setOpenTaskId = useUIStore((s) => s.setOpenTaskId);

  function handleClick(n: AppNotification) {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.entityType === "task" && n.entityId) setOpenTaskId(n.entityId);
  }

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Deadlines, reminders and activity."
        actions={
          data && data.items.length > 0 ? (
            <Button
              variant="outline"
              className="gap-1.5 rounded-xl"
              onClick={() => markAllRead.mutate()}
            >
              <Check className="size-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-1.5">
          {data.items.map((n) => {
            const meta = META[n.type] ?? META.reminder;
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "border-border hover:border-muted-foreground/30 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  n.isRead ? "bg-card/40" : "bg-card",
                )}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
                    color: meta.color,
                  }}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  {n.body && (
                    <p className="text-muted-foreground truncate text-xs">
                      {n.body}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {formatRelative(n.createdAt)}
                  </span>
                  {!n.isRead && (
                    <span className="bg-primary size-2 rounded-full" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Deadline reminders and activity will appear here."
        />
      )}
    </PageContainer>
  );
}
