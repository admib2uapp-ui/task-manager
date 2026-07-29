import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  requireRole,
  insertAuditLog,
  ROLE_MAP,
  unauthorized,
  badRequest,
  notFound,
} from "@/lib/supabase/route-handler";

const ASSIGNABLE_ROLES = ["owner", "senior", "general", "junior"];

async function ensureNotLastOwner(
  workspaceId: string,
): Promise<NextResponse | null> {
  const { count } = await supabaseAdmin
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("role", "owner")
    .eq("status", "active");

  if (count !== null && count <= 1) {
    return badRequest("Cannot remove the last Owner.");
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { user, workspace } = await getRouteContext();
    const { userId } = await params;

    const roleError = await requireRole(["owner"], user.id, workspace);
    if (roleError) return roleError;

    if (userId === user.id) {
      return badRequest("You cannot change your own role");
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return badRequest(
        `Role must be one of: ${ASSIGNABLE_ROLES.join(", ")}`,
      );
    }

    const { data: membership } = await supabaseAdmin
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", workspace.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return notFound("User is not a member of this workspace");
    }

    const normalizedRole = ROLE_MAP[membership.role] ?? membership.role;

    if (normalizedRole === "owner" && role !== "owner") {
      const lastOwnerError = await ensureNotLastOwner(workspace.id);
      if (lastOwnerError) return lastOwnerError;
    }

    const { error } = await supabaseAdmin
      .from("workspace_members")
      .update({ role })
      .eq("id", membership.id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    await insertAuditLog({
      userId: user.id,
      action: "ROLE_CHANGED",
      entityType: "workspace_member",
      entityId: membership.id,
      details: { targetUserId: userId, previousRole: normalizedRole, newRole: role },
    });

    return NextResponse.json({ success: true });
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { user, workspace } = await getRouteContext();
    const { userId } = await params;

    const roleError = await requireRole(["owner"], user.id, workspace);
    if (roleError) return roleError;

    if (userId === user.id) {
      return badRequest("You cannot remove yourself");
    }

    const { data: membership } = await supabaseAdmin
      .from("workspace_members")
      .select("id, role, status")
      .eq("workspace_id", workspace.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return notFound("User is not a member of this workspace");
    }

    const normalizedRole = ROLE_MAP[membership.role] ?? membership.role;

    if (normalizedRole === "owner") {
      const lastOwnerError = await ensureNotLastOwner(workspace.id);
      if (lastOwnerError) return lastOwnerError;
    }

    const { error } = await supabaseAdmin
      .from("workspace_members")
      .update({ status: "removed" })
      .eq("id", membership.id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    await insertAuditLog({
      userId: user.id,
      action: "MEMBER_REMOVED",
      entityType: "workspace_member",
      entityId: membership.id,
      details: { targetUserId: userId, previousRole: normalizedRole },
    });

    const { data: targetUser } = await supabaseAdmin
      .from("users")
      .select("email, name")
      .eq("id", userId)
      .single();

    if (targetUser) {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        type: "member_removed",
        title: "You have been removed from the workspace",
        body: `You have been removed from ${workspace.name} by ${user.name}.`,
        entity_type: "workspace",
        entity_id: workspace.id,
        category: "workspace",
      });

      await supabaseAdmin.from("email_queue").insert({
        user_id: userId,
        to_email: targetUser.email,
        template_name: "member-removed",
        subject: `Removed from ${workspace.name}`,
        data: { workspaceName: workspace.name, memberName: user.name },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return unauthorized();
  }
}
