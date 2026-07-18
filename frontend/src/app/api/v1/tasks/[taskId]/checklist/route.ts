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

    const { data: maxPos } = await supabaseAdmin
      .from("checklist_items")
      .select("position")
      .eq("task_id", taskId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPos = (maxPos?.[0]?.position ?? 0) + 1024;

    const { data, error } = await supabaseAdmin
      .from("checklist_items")
      .insert({ task_id: taskId, content: body.content, position: nextPos })
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
