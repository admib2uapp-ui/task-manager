import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { workspace } = await getRouteContext();

    const { data } = await supabaseAdmin
      .from("notes")
      .select("id, workspace_id, project_id, title, created_at, updated_at")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false });

    return NextResponse.json(data || []);
  } catch {
    return unauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await getRouteContext();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert({
        workspace_id: workspace.id,
        project_id: body.projectId || null,
        title: body.title || "Untitled",
        content: body.content || "",
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
