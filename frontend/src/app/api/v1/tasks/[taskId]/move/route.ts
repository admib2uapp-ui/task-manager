import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    await getRouteContext();
    const { taskId } = await params;
    const body = await request.json();
    const { status, position } = body;

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (position !== undefined) updates.position = position;

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
