import { FolderKanban, Plus } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Organize your work into focused projects."
        actions={
          <Button className="gap-1.5 rounded-xl">
            <Plus className="size-4" /> New Project
          </Button>
        }
      />
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create a project to start organizing tasks, milestones and notes."
        action={
          <Button className="gap-1.5 rounded-xl">
            <Plus className="size-4" /> Create your first project
          </Button>
        }
      />
    </PageContainer>
  );
}
