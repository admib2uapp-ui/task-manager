"use client";

import { GitBranch, Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RepositoryCard } from "@/features/repositories/components/repository-card";
import { RepositoryConnectDialog } from "@/features/repositories/components/repository-connect-dialog";
import { useRepositories } from "@/features/repositories/hooks/use-repositories";

export function RepositoryList() {
  const { data: connections = [], isLoading } = useRepositories();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <PageContainer>
      <PageHeader
        title="Repositories"
        description="Connect and analyze GitHub repositories."
        actions={
          <Button
            className="gap-1.5 rounded-xl"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" /> Connect repo
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : connections.length > 0 ? (
        <div className="space-y-3">
          {connections.map((conn) => (
            <RepositoryCard key={conn.id} connection={conn} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GitBranch}
          title="No repositories connected"
          description="Connect a GitHub repository to start scanning, analyzing, and generating AI insights."
          action={
            <Button
              className="gap-1.5 rounded-xl"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4" /> Connect your first repo
            </Button>
          }
        />
      )}

      <RepositoryConnectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </PageContainer>
  );
}
