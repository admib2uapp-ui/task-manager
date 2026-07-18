"use client";

import { FolderKanban, ListChecks, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { flatNavigation } from "@/config/navigation";
import { getProjectIcon } from "@/config/icons";
import { TASK_PRIORITY_META } from "@/config/constants";
import { useSearch } from "@/features/search/hooks/use-search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUIStore } from "@/stores/ui-store";
import type { TaskPriority } from "@/types/domain";

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setQuickCreateOpen = useUIStore((s) => s.setQuickCreateOpen);
  const setOpenTaskId = useUIStore((s) => s.setOpenTaskId);

  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 200);
  const { data: results } = useSearch(debounced);

  const hasQuery = query.trim().length > 0;
  const navItems = hasQuery
    ? flatNavigation.filter((i) =>
        i.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : flatNavigation;

  function run(action: () => void) {
    setOpen(false);
    setQuery("");
    action();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
      title="Command Palette"
      description="Search projects, tasks and commands"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search or run a command…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {results && results.projects.length > 0 && (
            <CommandGroup heading="Projects">
              {results.projects.map((project) => {
                const Icon = getProjectIcon(project.icon);
                return (
                  <CommandItem
                    key={project.id}
                    value={`project-${project.id}`}
                    onSelect={() =>
                      run(() => router.push(`/projects/${project.id}`))
                    }
                  >
                    <Icon className="size-4" style={{ color: project.color }} />
                    {project.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {results && results.tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {results.tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task-${task.id}`}
                  onSelect={() => run(() => setOpenTaskId(task.id))}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        TASK_PRIORITY_META[task.priority as TaskPriority]
                          ?.color ?? "#71717a",
                    }}
                  />
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {task.projectName}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {(results?.projects.length || results?.tasks.length) && (
            <CommandSeparator />
          )}

          <CommandGroup heading="Actions">
            <CommandItem
              value="create-task"
              onSelect={() => run(() => setQuickCreateOpen(true))}
            >
              <Plus className="size-4" />
              Create task
            </CommandItem>
            <CommandItem
              value="go-projects"
              onSelect={() => run(() => router.push("/projects"))}
            >
              <FolderKanban className="size-4" />
              View projects
            </CommandItem>
            <CommandItem
              value="go-tasks"
              onSelect={() => run(() => router.push("/tasks"))}
            >
              <ListChecks className="size-4" />
              View my tasks
            </CommandItem>
          </CommandGroup>

          {navItems.length > 0 && (
            <CommandGroup heading="Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`nav-${item.href}`}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <Icon className="size-4" />
                    {item.title}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
