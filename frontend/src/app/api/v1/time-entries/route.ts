import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user } = await getRouteContext();

    const { data } = await supabaseAdmin
      .from("time_entries")
      .select(
        "*, task:tasks(id, title, project_id), project:projects(id, name, color, icon)",
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(50);

    return NextResponse.json(data || []);
  } catch {
    return unauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getRouteContext();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("time_entries")
      .insert({
        user_id: user.id,
        task_id: body.taskId || null,
        project_id: body.projectId || null,
        description: body.description || null,
        started_at: body.startedAt || new Date().toISOString(),
        ended_at: body.endedAt || null,
        duration_seconds: body.durationSeconds || 0,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
