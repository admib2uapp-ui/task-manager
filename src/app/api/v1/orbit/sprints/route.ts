import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    await getRouteContext();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("orbit_sprints")
      .select("*, tasks:orbit_sprint_tasks(*)")
      .eq("project_id", projectId)
      .order("start_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch sprints" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await getRouteContext();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("orbit_sprints")
      .insert({
        project_id: body.projectId,
        name: body.name,
        goal: body.goal ?? null,
        start_date: body.startDate,
        end_date: body.endDate,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create sprint" }, { status: 500 });
  }
}