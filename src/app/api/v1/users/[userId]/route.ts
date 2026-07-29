import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  requireRole,
  ROLE_MAP,
  unauthorized,
  badRequest,
  notFound,
} from "@/lib/supabase/route-handler";

const ASSIGNABLE_ROLES = ["owner", "senior", "general", "junior"];

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
      const { count } = await supabaseAdmin
        .from("workspace_members")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("role", "owner");

      if (count !== null && count <= 1) {
        return badRequest("Cannot remove the last Owner.");
      }
    }

    const { error } = await supabaseAdmin
      .from("workspace_members")
      .update({ role })
      .eq("id", membership.id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return unauthorized();
  }
}
