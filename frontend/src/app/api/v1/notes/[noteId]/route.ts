import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  notFound,
} from "@/lib/supabase/route-handler";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { workspace } = await getRouteContext();
    const { noteId } = await params;

    const { data } = await supabaseAdmin
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .eq("workspace_id", workspace.id)
      .single();

    if (!data) return notFound("Note");
    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { workspace } = await getRouteContext();
    const { noteId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;

    const { data, error } = await supabaseAdmin
      .from("notes")
      .update(updates)
      .eq("id", noteId)
      .eq("workspace_id", workspace.id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    if (!data) return notFound("Note");

    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { workspace } = await getRouteContext();
    const { noteId } = await params;

    await supabaseAdmin
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("workspace_id", workspace.id);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
