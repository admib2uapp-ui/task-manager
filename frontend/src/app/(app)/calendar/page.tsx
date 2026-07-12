import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Plan deadlines across month, week and day views."
      />
      <EmptyState
        icon={Calendar}
        title="Calendar coming together"
        description="Your scheduled tasks and deadlines will appear here."
      />
    </PageContainer>
  );
}
