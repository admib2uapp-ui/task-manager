import { GitBranch } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "GitHub" };

export default function GitHubPage() {
  return (
    <PageContainer>
      <PageHeader
        title="GitHub"
        description="Link repositories, issues and pull requests to your work."
      />
      <EmptyState
        icon={GitBranch}
        title="Connect GitHub"
        description="Link commits, issues and PRs to tasks to keep engineering context in one place."
      />
    </PageContainer>
  );
}
