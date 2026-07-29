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

export const ROLE_MAP: Record<string, string> = {
  admin: "senior",
  member: "general",
  viewer: "junior",
};

export async function getMemberStatus(
  userId: string,
  workspaceId: string,
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("workspace_members")
    .select("status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.status ?? null;
}

export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string,
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.role) return null;
  return ROLE_MAP[data.role] ?? data.role;
}

export async function requireRole(
  allowedRoles: string[],
  userId: string,
  workspace: Workspace,
): Promise<NextResponse | null> {
  const status = await getMemberStatus(userId, workspace.id);
  if (status === "blocked") return forbidden("Your account has been blocked");

  const role = await getUserWorkspaceRole(userId, workspace.id);
  if (role && allowedRoles.includes(role)) return null;
  if (role === "owner") return null;
  if (userId === workspace.ownerId) return null;
  return forbidden("You do not have permission to perform this action");
}

export async function getProjectRole(
  userId: string,
  projectId: string,
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

export async function requireProjectMember(
  userId: string,
  projectId: string,
): Promise<NextResponse | null> {
  const role = await getProjectRole(userId, projectId);
  if (role) return null;
  return forbidden("You are not a member of this project");
}

export async function requireProjectRole(
  allowedRoles: string[],
  userId: string,
  projectId: string,
): Promise<NextResponse | null> {
  const role = await getProjectRole(userId, projectId);
  if (role && allowedRoles.includes(role)) return null;
  return forbidden("You do not have the required project role");
}

export function forbidden(message = "You do not have permission") {
  return NextResponse.json({ detail: message }, { status: 403 });
}

export function requireWorkspaceOwner(
  userId: string,
  workspace: Workspace,
): NextResponse | null {
  if (userId === workspace.ownerId) return null;
  return forbidden("Only the workspace owner can perform this action");
}

export async function requireOwnership(
  createdBy: string | null | undefined,
  userId: string,
  workspaceId: string,
  assigneeId?: string | null,
): Promise<NextResponse | null> {
  if (createdBy === userId) return null;
  if (assigneeId !== undefined && assigneeId === userId) return null;

  const { data: membership } = await supabaseAdmin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  const normalizedRole = membership?.role ? (ROLE_MAP[membership.role] ?? membership.role) : null;
  if (normalizedRole === "owner") return null;

  return forbidden("You do not have permission to modify this resource");
}

export async function insertAuditLog(args: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  await supabaseAdmin.from("audit_logs").insert({
    user_id: args.userId,
    action: args.action,
    entity_type: args.entityType,
    entity_id: args.entityId || null,
    details: args.details || null,
  });
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

  const { data: existing } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("workspace_members")
      .insert({ workspace_id: existing.id, user_id: userId, role: "general" });
    return existing;
  }

  const { data: newWs } = await supabaseAdmin
    .from("workspaces")
    .insert({ name: "Team Workspace", slug: "team", owner_id: userId })
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
