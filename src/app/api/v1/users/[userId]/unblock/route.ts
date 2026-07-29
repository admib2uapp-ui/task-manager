import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  requireRole,
  ROLE_MAP,
  insertAuditLog,
  unauthorized,
  badRequest,
  notFound,
} from "@/lib/supabase/route-handler";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { user, workspace } = await getRouteContext();
    const { userId } = await params;

    const roleError = await requireRole(["owner"], user.id, workspace);
    if (roleError) return roleError;

    const { data: membership } = await supabaseAdmin
      .from("workspace_members")
      .select("id, role, status")
      .eq("workspace_id", workspace.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return notFound("User is not a member of this workspace");
    }

    if (membership.status !== "blocked") {
      return badRequest("User is not blocked");
    }

    const { error } = await supabaseAdmin
      .from("workspace_members")
      .update({ status: "active" })
      .eq("id", membership.id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    const normalizedRole = ROLE_MAP[membership.role] ?? membership.role;

    await insertAuditLog({
      userId: user.id,
      action: "MEMBER_UNBLOCKED",
      entityType: "workspace_member",
      entityId: membership.id,
      details: { targetUserId: userId, role: normalizedRole },
    });

    const { data: targetUser } = await supabaseAdmin
      .from("users")
      .select("email, name")
      .eq("id", userId)
      .single();

    if (targetUser) {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        type: "member_unblocked",
        title: "You have been unblocked from the workspace",
        body: `Your access to ${workspace.name} has been restored by ${user.name}.`,
        entity_type: "workspace",
        entity_id: workspace.id,
        category: "workspace",
      });

      await supabaseAdmin.from("email_queue").insert({
        user_id: userId,
        to_email: targetUser.email,
        template_name: "member-unblocked",
        subject: `Unblocked from ${workspace.name}`,
        data: { workspaceName: workspace.name, memberName: user.name },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return unauthorized();
  }
}
