import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Productivity, velocity and completion insights."
      />
      <EmptyState
        icon={BarChart3}
        title="Not enough data yet"
        description="Complete a few tasks to unlock burndown, velocity and productivity charts."
      />
    </PageContainer>
  );
}
