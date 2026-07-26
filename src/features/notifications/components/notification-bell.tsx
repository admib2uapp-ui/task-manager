"use client";

import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useMarkAllRead } from "@/features/notifications/hooks/use-notifications";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";


const CATEGORY_COLORS: Record<string, string> = {
  deadline: "#f59e0b",
  task: "#3b82f6",
  project: "#a855f7",
  chat: "#06b6d4",
  ai: "#22c55e",
  github: "#6366f1",
  security: "#ef4444",
  workspace: "#71717a",
  system: "#71717a",
};

export function NotificationBell() {
  const { data, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const recent = items.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative size-9 rounded-xl"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] leading-4 font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-2xl p-0 shadow-xl"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">
            Notifications
            {unreadCount > 0 && (
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                ({unreadCount} unread)
              </span>
            )}
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium transition-colors"
            >
              <Check className="size-3" />
              Mark all read
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground text-xs">Loading...</span>
            </div>
          ) : recent.length > 0 ? (
            <div className="py-1">
              {recent.map((n) => {
                const color = CATEGORY_COLORS[n.type] ?? CATEGORY_COLORS.default ?? "#71717a";
                return (
                  <Link
                    key={n.id}
                    href={
                      n.entityType === "task" && n.entityId
                        ? `/tasks?taskId=${n.entityId}`
                        : "/notifications"
                    }
                    className={cn(
                      "hover:bg-muted/50 flex items-start gap-3 px-4 py-3 text-left transition-colors",
                      !n.isRead && "bg-muted/20",
                    )}
                  >
                    <span
                      className="mt-0.5 grid size-2 shrink-0 place-items-center rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm",
                          !n.isRead ? "font-semibold" : "text-muted-foreground",
                        )}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                          {n.body}
                        </p>
                      )}
                      <p className="text-muted-foreground/60 mt-1 text-[10px]">
                        {formatRelative(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground text-xs">
                No notifications yet
              </span>
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2.5">
          <Link
            href="/notifications"
            className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 text-xs font-medium transition-colors"
          >
            <ExternalLink className="size-3" />
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
