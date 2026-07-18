import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  notFound,
  requireOwnership,
} from "@/lib/supabase/route-handler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { user, workspace } = await getRouteContext();
    const { taskId } = await params;
    const body = await request.json();
    const { status, position } = body;

    const { data: existing } = await supabaseAdmin
      .from("tasks")
      .select("created_by, assignee_id")
      .eq("id", taskId)
      .single();

    if (!existing) return notFound("Task");

    const ownershipError = await requireOwnership(
      existing.created_by, user.id, workspace.id, existing.assignee_id,
    );
    if (ownershipError) return ownershipError;

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (position !== undefined) updates.position = position;
    updates.updated_by = user.id;

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });

    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}
