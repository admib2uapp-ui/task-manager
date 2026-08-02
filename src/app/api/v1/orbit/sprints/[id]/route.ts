import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await getRouteContext();

    const { data, error } = await supabaseAdmin
      .from("orbit_sprints")
      .select("*, tasks:orbit_sprint_tasks(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await getRouteContext();
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.goal !== undefined) updateData.goal = body.goal;
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.velocity !== undefined) updateData.velocity = body.velocity;

    const { data, error } = await supabaseAdmin
      .from("orbit_sprints")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to update sprint" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await getRouteContext();

    const { error } = await supabaseAdmin
      .from("orbit_sprints")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ message: "Sprint deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete sprint" }, { status: 500 });
  }
}
