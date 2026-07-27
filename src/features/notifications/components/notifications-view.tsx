"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  GitBranch,
  MessageSquare,
  Search,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppNotification } from "@/features/notifications/api/notifications-api";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@/features/notifications/hooks/use-notifications";
import { useUIStore } from "@/stores/ui-store";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: null, label: "All", icon: Bell },
  { id: "deadline", label: "Deadlines", icon: CalendarClock },
  { id: "task", label: "Tasks", icon: CheckCircle2 },
  { id: "project", label: "Projects", icon: Users },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "ai", label: "AI", icon: Bell },
  { id: "github", label: "GitHub", icon: GitBranch },
  { id: "security", label: "Security", icon: Shield },
] as const;

const TYPE_META: Record<string, { icon: typeof Bell; color: string; category: string }> = {
  overdue: { icon: AlertTriangle, color: "#ef4444", category: "deadline" },
  deadline: { icon: CalendarClock, color: "#f59e0b", category: "deadline" },
  comment: { icon: MessageSquare, color: "#3b82f6", category: "task" },
  comment_added: { icon: MessageSquare, color: "#3b82f6", category: "task" },
  assigned: { icon: UserPlus, color: "#a855f7", category: "task" },
  task_assigned: { icon: UserPlus, color: "#a855f7", category: "task" },
  reminder: { icon: Bell, color: "#71717a", category: "deadline" },
  completed: { icon: CheckCircle2, color: "#22c55e", category: "task" },
  task_completed: { icon: CheckCircle2, color: "#22c55e", category: "task" },
  mention: { icon: MessageSquare, color: "#06b6d4", category: "chat" },
  chat_mention: { icon: MessageSquare, color: "#06b6d4", category: "chat" },
  task_created: { icon: CheckCircle2, color: "#3b82f6", category: "task" },
  task_reopened: { icon: CheckCircle2, color: "#f59e0b", category: "task" },
  task_deleted: { icon: X, color: "#ef4444", category: "task" },
  task_updated: { icon: CheckCircle2, color: "#6366f1", category: "task" },
  priority_changed: { icon: AlertTriangle, color: "#f59e0b", category: "task" },
  deadline_changed: { icon: CalendarClock, color: "#f59e0b", category: "deadline" },
  project_created: { icon: Users, color: "#22c55e", category: "project" },
  project_archived: { icon: Users, color: "#ef4444", category: "project" },
  project_restored: { icon: Users, color: "#22c55e", category: "project" },
  member_joined: { icon: UserPlus, color: "#a855f7", category: "project" },
  member_removed: { icon: X, color: "#ef4444", category: "project" },
  project_completed: { icon: CheckCircle2, color: "#22c55e", category: "project" },
  chat_reply: { icon: MessageSquare, color: "#06b6d4", category: "chat" },
  chat_reaction: { icon: Bell, color: "#f59e0b", category: "chat" },
  chat_pinned: { icon: Bell, color: "#ef4444", category: "chat" },
  chat_new_message: { icon: MessageSquare, color: "#3b82f6", category: "chat" },
  ai_report_ready: { icon: Bell, color: "#22c55e", category: "ai" },
  ai_security_scan: { icon: Shield, color: "#ef4444", category: "ai" },
  github_repo_connected: { icon: GitBranch, color: "#6366f1", category: "github" },
  github_repo_disconnected: { icon: GitBranch, color: "#ef4444", category: "github" },
  github_pr_linked: { icon: GitBranch, color: "#22c55e", category: "github" },
  github_issue_linked: { icon: GitBranch, color: "#f59e0b", category: "github" },
  login_new_device: { icon: Shield, color: "#f59e0b", category: "security" },
  password_changed: { icon: Shield, color: "#3b82f6", category: "security" },
  email_changed: { icon: Shield, color: "#ef4444", category: "security" },
  permission_changed: { icon: Shield, color: "#f59e0b", category: "security" },
  workspace_invitation: { icon: UserPlus, color: "#a855f7", category: "workspace" },
  system_update: { icon: Bell, color: "#71717a", category: "system" },
};

const DEFAULT_META = { icon: Bell, color: "#71717a", category: "system" };

export function NotificationsView() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const setOpenTaskId = useUIStore((s) => s.setOpenTaskId);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = (data?.items ?? []).filter((n) => {
    const meta = TYPE_META[n.type] ?? DEFAULT_META;
    if (activeCategory && meta.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !(n.body?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

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

      {/* Category filter pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id ?? "all"}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 rounded-xl pl-9"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-1.5">
          {filteredItems.map((n) => {
            const meta = TYPE_META[n.type] ?? DEFAULT_META;
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
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        !n.isRead ? "font-semibold" : "",
                      )}
                    >
                      {n.title}
                    </p>
                    {n.category && (
                      <Badge
                        variant="outline"
                        className="shrink-0 rounded-full px-2 text-[10px] capitalize"
                      >
                        {n.category}
                      </Badge>
                    )}
                  </div>
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
          title={
            searchQuery
              ? "No matching notifications"
              : "You're all caught up"
          }
          description={
            searchQuery
              ? "Try a different search term or clear filters."
              : "Deadline reminders and activity will appear here."
          }
        />
      )}
    </PageContainer>
  );
}
