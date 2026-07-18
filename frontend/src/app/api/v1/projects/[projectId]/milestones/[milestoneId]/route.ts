import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  notFound,
  requireOwnership,
  insertAuditLog,
} from "@/lib/supabase/route-handler";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; milestoneId: string }> },
) {
  try {
    const { user, workspace } = await getRouteContext();
    const { milestoneId } = await params;
    const body = await request.json();

    const { data: existing } = await supabaseAdmin
      .from("milestones")
      .select("created_by, project:projects(workspace_id)")
      .eq("id", milestoneId)
      .single();

    if (!existing) return notFound("Milestone");

    const ownershipError = await requireOwnership(
      existing.created_by, user.id, workspace.id,
    );
    if (ownershipError) return ownershipError;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.dueDate !== undefined) updates.due_date = body.dueDate;
    if (body.completed !== undefined) updates.completed = body.completed;
    updates.updated_by = user.id;

    const { data, error } = await supabaseAdmin
      .from("milestones")
      .update(updates)
      .eq("id", milestoneId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    if (!data) return notFound("Milestone");

    await insertAuditLog({
      userId: user.id,
      action: "UPDATE_MILESTONE",
      entityType: "Milestone",
      entityId: milestoneId,
      details: { changes: Object.keys(updates).filter((k) => k !== "updated_by") },
    });

    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; milestoneId: string }> },
) {
  try {
    const { user, workspace } = await getRouteContext();
    const { milestoneId } = await params;

    const { data: existing } = await supabaseAdmin
      .from("milestones")
      .select("created_by, project:projects(workspace_id)")
      .eq("id", milestoneId)
      .single();

    if (!existing) return notFound("Milestone");

    const ownershipError = await requireOwnership(
      existing.created_by, user.id, workspace.id,
    );
    if (ownershipError) return ownershipError;

    await insertAuditLog({
      userId: user.id,
      action: "DELETE_MILESTONE",
      entityType: "Milestone",
      entityId: milestoneId,
    });

    await supabaseAdmin.from("milestones").delete().eq("id", milestoneId);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
