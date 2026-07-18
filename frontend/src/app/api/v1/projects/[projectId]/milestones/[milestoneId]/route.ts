import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  notFound,
} from "@/lib/supabase/route-handler";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; milestoneId: string }> },
) {
  try {
    await getRouteContext();
    const { milestoneId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.dueDate !== undefined) updates.due_date = body.dueDate;
    if (body.completed !== undefined) updates.completed = body.completed;

    const { data, error } = await supabaseAdmin
      .from("milestones")
      .update(updates)
      .eq("id", milestoneId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    if (!data) return notFound("Milestone");

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
    await getRouteContext();
    const { milestoneId } = await params;

    await supabaseAdmin.from("milestones").delete().eq("id", milestoneId);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
