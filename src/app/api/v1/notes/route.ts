import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  insertAuditLog,
} from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { workspace } = await getRouteContext();

    const { data } = await supabaseAdmin
      .from("notes")
      .select("id, workspace_id, project_id, title, created_by, updated_by, created_at, updated_at")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false });

    const notes = (data || []).map((n: Record<string, unknown>) => ({
      id: n.id,
      workspaceId: n.workspace_id,
      projectId: n.project_id,
      title: n.title,
      createdBy: n.created_by,
      updatedBy: n.updated_by,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));

    return NextResponse.json(notes);
  } catch {
    return unauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const { user, workspace } = await getRouteContext();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert({
        workspace_id: workspace.id,
        project_id: body.projectId || null,
        title: body.title || "Untitled",
        content: body.content || "",
        created_by: user.id,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });

    await insertAuditLog({
      userId: user.id,
      action: "CREATE_NOTE",
      entityType: "Note",
      entityId: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
