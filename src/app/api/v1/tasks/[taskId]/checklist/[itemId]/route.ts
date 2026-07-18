import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string; itemId: string }> },
) {
  try {
    await getRouteContext();
    const { itemId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.content !== undefined) updates.content = body.content;
    if (body.completed !== undefined) updates.completed = body.completed;

    const { data, error } = await supabaseAdmin
      .from("checklist_items")
      .update(updates)
      .eq("id", itemId)
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
  { params }: { params: Promise<{ taskId: string; itemId: string }> },
) {
  try {
    await getRouteContext();
    const { itemId } = await params;

    await supabaseAdmin.from("checklist_items").delete().eq("id", itemId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
