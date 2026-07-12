import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        description="Rich notes, specs and research with markdown support."
      />
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Create notes and documents to capture ideas, specs and research."
      />
    </PageContainer>
  );
}
