import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  try {
    const { user } = await getRouteContext();
    const body = await request.json();

    await supabaseAdmin
      .from("time_entries")
      .update({ ended_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("ended_at", null);

    const { data, error } = await supabaseAdmin
      .from("time_entries")
      .insert({
        user_id: user.id,
        task_id: body.taskId || null,
        project_id: body.projectId || null,
        description: body.description || null,
        started_at: new Date().toISOString(),
        duration_seconds: 0,
      })
      .select(
        "*, task:tasks(id, title, project_id), project:projects(id, name, color, icon)",
      )
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
