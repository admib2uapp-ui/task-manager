"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getProjectIcon } from "@/config/icons";
import { PROJECT_STATUS_META } from "@/config/constants";
import { ColorPicker } from "@/features/projects/components/color-picker";
import { IconPicker } from "@/features/projects/components/icon-picker";
import { TagSelector } from "@/features/projects/components/tag-selector";
import {
  useCreateProject,
  useUpdateProject,
} from "@/features/projects/hooks/use-projects";
import {
  projectFormSchema,
  type ProjectFormValues,
} from "@/features/projects/schemas";
import type { Project } from "@/types/domain";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onCreated?: (project: Project) => void;
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onCreated,
}: ProjectFormDialogProps) {
  const isEdit = Boolean(project);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3b82f6",
      icon: "folder",
      status: "active",
      deadline: "",
      repositoryUrl: "",
      tagIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: project?.name ?? "",
        description: project?.description ?? "",
        color: project?.color ?? "#3b82f6",
        icon: project?.icon ?? "folder",
        status: project?.status ?? "active",
        deadline: toDateInput(project?.deadline),
        repositoryUrl: project?.repositoryUrl ?? "",
        tagIds: project?.tags.map((t) => t.id) ?? [],
      });
    }
  }, [open, project, form]);

  const color = form.watch("color");
  const icon = form.watch("icon");
  const Icon = getProjectIcon(icon);

  async function onSubmit(values: ProjectFormValues) {
    const payload = {
      name: values.name,
      description: values.description || null,
      color: values.color,
      icon: values.icon,
      status: values.status,
      deadline: values.deadline ? `${values.deadline}T00:00:00Z` : null,
      repositoryUrl: values.repositoryUrl || null,
      tagIds: values.tagIds,
    };

    if (isEdit && project) {
      await updateProject.mutateAsync({ id: project.id, payload });
    } else {
      const created = await createProject.mutateAsync(payload);
      onCreated?.(created);
    }
    onOpenChange(false);
  }

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2.5">
            <span
              className="grid size-8 place-items-center rounded-lg"
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
                color,
              }}
            >
              <Icon className="size-4.5" />
            </span>
            {isEdit ? "Edit project" : "New project"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configure your project details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[60dvh]">
              <div className="space-y-5 px-6 py-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. YOLO Detection Pipeline"
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="What is this project about?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Color</Label>
                  <ColorPicker
                    value={color}
                    onChange={(c) =>
                      form.setValue("color", c, { shouldDirty: true })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <IconPicker
                    value={icon}
                    color={color}
                    onChange={(i) =>
                      form.setValue("icon", i, { shouldDirty: true })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(PROJECT_STATUS_META).map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="repositoryUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://github.com/user/repo"
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagSelector
                    selectedIds={form.watch("tagIds")}
                    onChange={(ids) =>
                      form.setValue("tagIds", ids, { shouldDirty: true })
                    }
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-border border-t px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
