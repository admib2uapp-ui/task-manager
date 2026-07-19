"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Users } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useWorkspaceMembers } from "@/features/users/hooks/use-users";
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
  const { data: members = [] } = useWorkspaceMembers();

  const generalMembers = members.filter(
    (m) => m.workspaceRole === "general",
  );

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
      memberIds: [],
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
        memberIds: [],
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
      memberIds: values.memberIds,
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
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 px-6 py-5 pb-6">
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          <SelectContent className="z-[70]">
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

                {!isEdit && generalMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Users className="text-muted-foreground size-4" />
                      Members
                      <span className="text-muted-foreground text-xs font-normal">
                        (optional)
                      </span>
                    </Label>
                    <div className="border-border max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                      {generalMembers.map((m) => {
                        const checked = form
                          .watch("memberIds")
                          .includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className="hover:bg-accent flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(val) => {
                                const current =
                                  form.getValues("memberIds");
                                if (val) {
                                  form.setValue("memberIds", [
                                    ...current,
                                    m.id,
                                  ]);
                                } else {
                                  form.setValue(
                                    "memberIds",
                                    current.filter(
                                      (id) => id !== m.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {m.name}
                            </span>
                            <span className="text-muted-foreground shrink-0 text-xs">
                              {m.email}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/50 border-border flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
