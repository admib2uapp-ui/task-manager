import { ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "My Tasks" };

export default function TasksPage() {
  return (
    <PageContainer>
      <PageHeader
        title="My Tasks"
        description="Everything assigned to you across all projects."
      />
      <EmptyState
        icon={ListChecks}
        title="No tasks assigned"
        description="Tasks assigned to you will show up here, grouped by status and priority."
      />
    </PageContainer>
  );
}
