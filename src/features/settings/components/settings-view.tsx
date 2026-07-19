"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Loader2, Monitor, Moon, Shield, Sun, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { authApi } from "@/features/auth/api/auth-api";
import { useWorkspaceMembers } from "@/features/users/hooks/use-users";
import { usersApi } from "@/features/users/api/users-api";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  senior: "Senior",
  general: "General",
  junior: "Junior",
};

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  avatarUrl: z.string().trim().url("Enter a valid URL").or(z.literal("")),
});
type ProfileValues = z.infer<typeof profileSchema>;

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function SettingsView() {
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? "" },
  });

  const updateProfile = useMutation({
    mutationFn: async (values: ProfileValues) => authApi.updateProfile(values),
    onSuccess: () => {
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    },
  });

  const { data: members = [] } = useWorkspaceMembers();
  const queryClient = useQueryClient();

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      usersApi.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "workspace-members"] });
      toast.success("Role updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
      );
    },
  });

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your profile and preferences."
      />

      <div className="space-y-6">
        <Card className="border-border bg-card shadow-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) => updateProfile.mutate(v))}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 rounded-2xl">
                    {form.watch("avatarUrl") && (
                      <AvatarImage src={form.watch("avatarUrl")} />
                    )}
                    <AvatarFallback className="bg-primary/15 text-primary rounded-2xl text-lg">
                      {getInitials(user?.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-muted-foreground text-xs">
                      Your account email cannot be changed.
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input
                          className="h-10"
                          placeholder="https://…"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-muted-foreground text-sm">Theme</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {THEMES.map((t) => {
                const active = mounted && theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <t.icon className="size-5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {user?.workspaceRole === "owner" && (
          <Card className="border-border bg-card shadow-soft rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="text-muted-foreground size-4" /> Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((m) => {
                  const currentRole = m.workspaceRole ?? "general";
                  const isSelf = m.id === user.id;
                  return (
                    <div
                      key={m.id}
                      className="hover:bg-accent flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
                    >
                      <Avatar className="size-8 rounded-lg">
                        {m.avatarUrl && <AvatarImage src={m.avatarUrl} />}
                        <AvatarFallback className="bg-primary/15 text-primary rounded-lg text-xs">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {m.name}
                          {isSelf && (
                            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {m.email}
                        </p>
                      </div>
                      {isSelf ? (
                        <span className="bg-muted text-muted-foreground shrink-0 rounded-md px-2.5 py-1 text-xs font-medium capitalize">
                          {ROLE_LABELS[currentRole] ?? currentRole}
                        </span>
                      ) : (
                        <Select
                          value={currentRole}
                          onValueChange={(role) =>
                            updateRole.mutate({ userId: m.id, role })
                          }
                          disabled={updateRole.isPending}
                        >
                          <SelectTrigger className="h-8 w-[120px] shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[70]">
                            <SelectItem value="senior">
                              <span className="flex items-center gap-2">
                                <Shield className="size-3.5" /> Senior
                              </span>
                            </SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="junior">Junior</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border bg-card shadow-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive gap-1.5 rounded-xl"
              onClick={() => {
                reset();
                router.replace("/login");
              }}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
