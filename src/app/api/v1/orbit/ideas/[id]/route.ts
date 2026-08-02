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
      .from("orbit_ideas")
      .select("*, creator:created_by(id, name, email, avatar_url), assignee:assignee_id(id, name, email, avatar_url)")
      .eq("id", id)
      .single();

    if (error) throw error;

    const { count: voteCount } = await supabaseAdmin
      .from("orbit_idea_votes")
      .select("id", { count: "exact", head: true })
      .eq("idea_id", id);

    return NextResponse.json({ ...data, voteCount: voteCount ?? 0 });
  } catch {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
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

    const { data, error } = await supabaseAdmin
      .from("orbit_ideas")
      .update({
        title: body.title,
        description: body.description,
        rich_text: body.richText,
        priority: body.priority,
        category: body.category,
        labels: body.labels,
        assignee_id: body.assigneeId,
        estimated_hours: body.estimatedHours,
        due_date: body.dueDate,
        status: body.status,
        ai_summary: body.aiSummary,
        github_links: body.githubLinks,
        related_task_ids: body.relatedTaskIds,
        related_file_urls: body.relatedFileUrls,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
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
      .from("orbit_ideas")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ message: "Idea deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
