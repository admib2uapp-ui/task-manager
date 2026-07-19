"use client";

import {
  Activity,
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  Flag,
  Loader2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECT_STATUS_META } from "@/config/constants";
import { getProjectIcon } from "@/config/icons";
import { MilestonesList } from "@/features/projects/components/milestones-list";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { ProjectBoard } from "@/features/tasks/components/project-board";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
} from "@/features/projects/hooks/use-projects";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const { data: project, isLoading, isError } = useProject(projectId);
  const update = useUpdateProject();
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = currentUser?.workspaceRole === "owner";
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const remove = useDeleteProject();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="text-muted-foreground flex justify-center py-24">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !project) {
    return (
      <PageContainer>
        <EmptyState
          icon={Flag}
          title="Project not found"
          description="This project may have been deleted or you don't have access."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/projects">Back to projects</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const Icon = getProjectIcon(project.icon);
  const statusMeta = PROJECT_STATUS_META[project.status];

  return (
    <PageContainer className="flex flex-col h-full">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" /> Projects
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="grid size-14 shrink-0 place-items-center rounded-2xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${project.color} 18%, transparent)`,
              color: project.color,
            }}
          >
            <Icon className="size-7" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <Badge
                variant="secondary"
                className="gap-1.5"
                style={{ color: statusMeta.color }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: statusMeta.color }}
                />
                {statusMeta.label}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground max-w-2xl text-sm">
                {project.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tag.color} 16%, transparent)`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() =>
              update.mutate({
                id: project.id,
                payload: { isFavorite: !project.isFavorite },
              })
            }
            aria-label="Toggle favorite"
          >
            <Star
              className={cn(
                "size-4",
                project.isFavorite && "fill-warning text-warning",
              )}
            />
          </Button>
          {isOwner && (
            <>
              <Button
                className="gap-1.5 rounded-xl"
                variant="outline"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" /> Edit
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-xl text-destructive hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
                aria-label="Delete project"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="board" className="mt-8">
        <TabsList>
          <TabsTrigger value="board">
            Board
            {project.taskCount ? ` (${project.taskCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">
            Milestones
            {project.milestoneCount ? ` (${project.milestoneCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <ProjectBoard projectId={project.id} projectColor={project.color} />
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border bg-card shadow-soft rounded-2xl lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold">Progress</h3>
                <div className="mt-3 flex items-center gap-4">
                  <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {project.progress}%
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  {project.completedMilestoneCount ?? 0} of{" "}
                  {project.milestoneCount ?? 0} milestones completed
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-soft rounded-2xl">
              <CardContent className="divide-border divide-y p-6 py-2">
                <DetailRow label="Status">{statusMeta.label}</DetailRow>
                <DetailRow label="Deadline">
                  {project.deadline ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3.5" />
                      {formatDate(project.deadline)}
                    </span>
                  ) : (
                    "—"
                  )}
                </DetailRow>
                <DetailRow label="Repository">
                  {project.repositoryUrl ? (
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Open <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    "—"
                  )}
                </DetailRow>
                <DetailRow label="Created">
                  {formatDate(project.createdAt)}
                  {project.creator && (
                    <span className="text-muted-foreground text-xs ml-1">
                      by {project.creator.name}
                    </span>
                  )}
                </DetailRow>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <MilestonesList projectId={project.id} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <EmptyState
            icon={Activity}
            title="Activity timeline coming soon"
            description="Project updates, comments and changes will appear here."
          />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project and all its tasks, milestones
              and notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => remove.mutate(project.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
