"use client";

import {
  ExternalLink,
  GitBranch,
  GitPullRequest,
  CircleDot,
  FolderGit2,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useUIStore } from "@/stores/ui-store";
import type { Task } from "@/types/domain";

function GithubLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof GitBranch;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="border-border text-muted-foreground hover:border-primary/40 hover:text-primary inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors"
    >
      <Icon className="size-3.5" /> {label}
      <ExternalLink className="size-3" />
    </a>
  );
}

export function GitHubView() {
  const { data: tasks, isLoading } = useTasks();
  const setOpenTaskId = useUIStore((s) => s.setOpenTaskId);

  const linked = (tasks ?? []).filter(
    (t: Task) =>
      t.githubRepoUrl || t.githubIssueUrl || t.githubPrUrl || t.githubBranch,
  );

  return (
    <PageContainer>
      <PageHeader
        title="GitHub"
        description="Tasks linked to repositories, issues and pull requests."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : linked.length > 0 ? (
        <div className="space-y-3">
          {linked.map((task) => (
            <Card
              key={task.id}
              className="border-border bg-card shadow-soft hover:border-muted-foreground/30 cursor-pointer rounded-2xl transition-colors"
              onClick={() => setOpenTaskId(task.id)}
            >
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  {task.project && (
                    <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: task.project.color }}
                      />
                      {task.project.name}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {task.githubRepoUrl && (
                    <GithubLink
                      href={task.githubRepoUrl}
                      icon={FolderGit2}
                      label="Repo"
                    />
                  )}
                  {task.githubIssueUrl && (
                    <GithubLink
                      href={task.githubIssueUrl}
                      icon={CircleDot}
                      label="Issue"
                    />
                  )}
                  {task.githubPrUrl && (
                    <GithubLink
                      href={task.githubPrUrl}
                      icon={GitPullRequest}
                      label="PR"
                    />
                  )}
                  {task.githubBranch && (
                    <span className="border-border text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                      <GitBranch className="size-3.5" /> {task.githubBranch}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GitBranch}
          title="No linked tasks yet"
          description="Add a repository, issue, PR or branch to any task and it will show up here."
        />
      )}
    </PageContainer>
  );
}
