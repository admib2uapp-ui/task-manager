import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User, Workspace } from "@/types/domain";

export interface RouteContext {
  user: User;
  workspace: Workspace;
}

function mapSupabaseUser(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  created_at: string;
}): User {
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: (authUser.user_metadata?.name as string) || authUser.email || "User",
    avatarUrl: (authUser.user_metadata?.avatar_url as string) ?? null,
    createdAt: authUser.created_at,
    updatedAt: authUser.created_at,
  };
}

export function unauthorized() {
  return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
}

export function notFound(entity = "Resource") {
  return NextResponse.json({ detail: `${entity} not found` }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ detail: message }, { status: 400 });
}

async function ensureWorkspace(userId: string): Promise<Workspace> {
  const { data: memberships } = await supabaseAdmin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1);

  if (memberships && memberships.length > 0) {
    const { data: ws } = await supabaseAdmin
      .from("workspaces")
      .select("*")
      .eq("id", memberships[0].workspace_id)
      .single();
    if (ws) return ws;
  }

  const slug = `workspace-${userId.slice(0, 8)}`;
  const { data: newWs } = await supabaseAdmin
    .from("workspaces")
    .insert({ name: "My Workspace", slug, owner_id: userId })
    .select()
    .single();

  if (!newWs) throw new Error("Failed to create workspace");

  await supabaseAdmin
    .from("workspace_members")
    .insert({ workspace_id: newWs.id, user_id: userId, role: "owner" });

  return newWs;
}

export async function getRouteContext(): Promise<RouteContext> {
  const headersList = await headers();
  const authHeader = headersList.get("Authorization");

  let token: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    throw new Error("Unauthorized");
  }

  const {
    data: { user: authUser },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !authUser) {
    throw new Error("Unauthorized");
  }

  const user = mapSupabaseUser(authUser);
  const workspace = await ensureWorkspace(authUser.id);

  return { user, workspace };
}
