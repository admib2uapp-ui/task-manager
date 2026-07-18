"use client";

import { FolderKanban, Plus, Search, Star } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectCardSkeleton } from "@/features/projects/components/project-card-skeleton";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/domain";

export function ProjectsView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: projects, isLoading } = useProjects({
    search: debouncedSearch || undefined,
    favorite: favoritesOnly || undefined,
    includeArchived: showArchived,
  });

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setDialogOpen(true);
  }

  const hasProjects = (projects?.length ?? 0) > 0;
  const isFiltering = Boolean(debouncedSearch) || favoritesOnly;

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Organize your work into focused projects."
        actions={
          <Button className="gap-1.5 rounded-xl" onClick={openCreate}>
            <Plus className="size-4" /> New Project
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="h-9 pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFavoritesOnly((v) => !v)}
            className={cn(
              "h-9 gap-1.5 rounded-xl",
              favoritesOnly && "border-warning/40 text-warning",
            )}
          >
            <Star className={cn("size-4", favoritesOnly && "fill-warning")} />
            Favorites
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
            className={cn(
              "h-9 rounded-xl",
              showArchived && "border-primary/40 text-primary",
            )}
          >
            {showArchived ? "Hiding archived" : "Show archived"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : hasProjects ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects!.map((project) => (
            <ProjectCard key={project.id} project={project} onEdit={openEdit} />
          ))}
        </div>
      ) : isFiltering ? (
        <EmptyState
          icon={Search}
          title="No matching projects"
          description="Try adjusting your search or filters."
        />
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to start organizing tasks, milestones and notes."
          action={
            <Button className="gap-1.5 rounded-xl" onClick={openCreate}>
              <Plus className="size-4" /> Create your first project
            </Button>
          }
        />
      )}

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
      />
    </PageContainer>
  );
}
