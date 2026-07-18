import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET(request: Request) {
  try {
    const { workspace } = await getRouteContext();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({ projects: [], tasks: [] });
    }

    const searchTerm = `%${q}%`;

    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("id, name, color, icon, status")
      .eq("workspace_id", workspace.id)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10);

    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select(
        "id, title, status, priority, project:projects!inner(id, name, color, icon)",
      )
      .eq("project.workspace_id", workspace.id)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10);

    return NextResponse.json({
      projects: projects || [],
      tasks: (tasks || []).map((t: Record<string, unknown>) => ({
        ...t,
        project: t.project,
      })),
    });
  } catch {
    return unauthorized();
  }
}
