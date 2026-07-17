"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { authApi } from "@/features/auth/api/auth-api";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User } from "@/types/domain";

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
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? "" },
  });

  const updateProfile = useMutation({
    mutationFn: (values: ProfileValues) =>
      authApi.updateProfile({
        name: values.name,
        avatarUrl: values.avatarUrl || null,
      }),
    onSuccess: (supabaseUser) => {
      if (!supabaseUser) return;
      const updated: User = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? user?.email ?? "",
        name: (supabaseUser.user_metadata?.name as string) ?? supabaseUser.email?.split("@")[0] ?? "",
        avatarUrl: (supabaseUser.user_metadata?.avatar_url as string) ?? null,
        createdAt: supabaseUser.created_at ?? new Date().toISOString(),
        updatedAt: supabaseUser.updated_at ?? new Date().toISOString(),
      };
      setUser(updated);
      toast.success("Profile updated");
    },
    onError: () => toast.error("Could not update profile"),
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

        <Card className="border-border bg-card shadow-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive gap-1.5 rounded-xl"
              onClick={() => logout.mutate()}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
