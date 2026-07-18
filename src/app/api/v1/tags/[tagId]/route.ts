import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  notFound,
} from "@/lib/supabase/route-handler";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tagId: string }> },
) {
  try {
    await getRouteContext();
    const { tagId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.color !== undefined) updates.color = body.color;

    const { data, error } = await supabaseAdmin
      .from("tags")
      .update(updates)
      .eq("id", tagId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    if (!data) return notFound("Tag");

    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tagId: string }> },
) {
  try {
    await getRouteContext();
    const { tagId } = await params;

    await supabaseAdmin.from("project_tags").delete().eq("tag_id", tagId);

    await supabaseAdmin.from("task_tags").delete().eq("tag_id", tagId);

    await supabaseAdmin.from("tags").delete().eq("id", tagId);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
