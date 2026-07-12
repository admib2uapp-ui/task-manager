import { Timer } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Time Tracking" };

export default function TimeTrackingPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Time Tracking"
        description="Track focused time per task and project."
      />
      <EmptyState
        icon={Timer}
        title="No time tracked yet"
        description="Start a timer from any task to begin logging your hours."
      />
    </PageContainer>
  );
}
