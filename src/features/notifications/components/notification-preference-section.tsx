"use client";

import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/hooks/use-notification-preferences";

const PREFERENCES = [
  { key: "assignmentEmails" as const, label: "Assignment Emails", description: "When a task or project is assigned to you" },
  { key: "deadlineEmails" as const, label: "Deadline Emails", description: "Deadline reminders and overdue alerts" },
  { key: "chatEmails" as const, label: "Chat Emails", description: "Mentions, replies, and new messages in chat" },
  { key: "githubEmails" as const, label: "GitHub Emails", description: "Repository and pull request updates" },
  { key: "aiEmails" as const, label: "AI Emails", description: "AI analysis and report notifications" },
  { key: "securityEmails" as const, label: "Security Emails", description: "Login alerts and security changes" },
  { key: "workspaceEmails" as const, label: "Workspace Emails", description: "Invitations and announcements" },
  { key: "systemEmails" as const, label: "System Emails", description: "Maintenance notices and system updates" },
];

export function NotificationPreferenceSection() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-muted-foreground text-sm">
          Choose which email notifications you want to receive.
        </p>
      </div>

      <div className="space-y-4">
        {PREFERENCES.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{label}</Label>
              <p className="text-muted-foreground text-xs">{description}</p>
            </div>
            <Switch
              checked={prefs?.[key] ?? true}
              onCheckedChange={(checked) => {
                updatePrefs.mutate({ [key]: checked });
              }}
              disabled={updatePrefs.isPending}
            />
          </div>
        ))}
      </div>

      <Separator className="my-8" />
    </div>
  );
}
