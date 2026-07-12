import { Bell } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description="Deadlines, assignments, comments and reminders."
      />
      <EmptyState
        icon={Bell}
        title="You're all caught up"
        description="Notifications about your tasks and projects will appear here."
      />
    </PageContainer>
  );
}
