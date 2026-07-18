"use client";

import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProjectIcon } from "@/config/icons";
import {
  useDeleteProject,
  useUpdateProject,
} from "@/features/projects/hooks/use-projects";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/domain";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const update = useUpdateProject();
  const remove = useDeleteProject();
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = currentUser?.id === project.createdBy;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const Icon = getProjectIcon(project.icon);

  function toggleFavorite(event: React.MouseEvent) {
    event.preventDefault();
    update.mutate({
      id: project.id,
      payload: { isFavorite: !project.isFavorite },
    });
  }

  return (
    <>
      <Card className="group border-border bg-card shadow-soft hover:border-muted-foreground/30 relative overflow-hidden rounded-2xl p-0 transition-colors">
        <Link href={`/projects/${project.id}`} className="block p-5">
          <div className="flex items-start justify-between gap-3">
            <div
              className="grid size-11 shrink-0 place-items-center rounded-xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${project.color} 18%, transparent)`,
                color: project.color,
              }}
            >
              <Icon className="size-5" />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-warning size-8 rounded-lg"
                onClick={toggleFavorite}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground size-8 rounded-lg opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={(e) => e.preventDefault()}
                      aria-label="Project actions"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.preventDefault()}
                  >
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Pencil className="size-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        update.mutate({
                          id: project.id,
                          payload: { isArchived: !project.isArchived },
                        })
                      }
                    >
                      {project.isArchived ? (
                        <>
                          <ArchiveRestore className="size-4" /> Unarchive
                        </>
                      ) : (
                        <>
                          <Archive className="size-4" /> Archive
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setConfirmOpen(true)}
                    >
                      <Trash2 className="size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <h3 className="mt-4 line-clamp-1 text-base font-semibold">
            {project.name}
          </h3>
          <p className="text-muted-foreground mt-1 line-clamp-2 min-h-[2.5rem] text-sm">
            {project.description || "No description"}
          </p>

          {/* Progress */}
          <div className="mt-4">
            <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs">
              <span>Progress</span>
              <span className="text-foreground font-medium">
                {project.progress}%
              </span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${project.progress}%`,
                  backgroundColor: project.color,
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tag.color} 16%, transparent)`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-muted-foreground text-[11px]">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
            {project.deadline && (
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatDate(project.deadline)}
              </span>
            )}
          </div>
        </Link>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{project.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project and all its tasks, milestones
              and notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate(project.id)}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
