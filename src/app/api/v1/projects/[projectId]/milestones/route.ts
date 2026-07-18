import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  insertAuditLog,
} from "@/lib/supabase/route-handler";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    await getRouteContext();
    const { projectId } = await params;

    const { data } = await supabaseAdmin
      .from("milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    return NextResponse.json(data || []);
  } catch {
    return unauthorized();
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId } = await params;
    const body = await request.json();

    const { data: maxPos } = await supabaseAdmin
      .from("milestones")
      .select("position")
      .eq("project_id", projectId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPos = (maxPos?.[0]?.position ?? 0) + 1024;

    const { data, error } = await supabaseAdmin
      .from("milestones")
      .insert({
        project_id: projectId,
        name: body.name,
        description: body.description || null,
        due_date: body.dueDate || null,
        position: nextPos,
        created_by: user.id,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });

    await insertAuditLog({
      userId: user.id,
      action: "CREATE_MILESTONE",
      entityType: "Milestone",
      entityId: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
