import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string; subtaskId: string }> },
) {
  try {
    await getRouteContext();
    const { subtaskId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.completed !== undefined) updates.completed = body.completed;

    const { data, error } = await supabaseAdmin
      .from("subtasks")
      .update(updates)
      .eq("id", subtaskId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string; subtaskId: string }> },
) {
  try {
    await getRouteContext();
    const { subtaskId } = await params;

    await supabaseAdmin.from("subtasks").delete().eq("id", subtaskId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
