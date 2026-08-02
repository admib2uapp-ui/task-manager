import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { workspace } = await getRouteContext();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    let query = supabaseAdmin
      .from("orbit_ideas")
      .select("*, creator:created_by(id, name, email, avatar_url), assignee:assignee_id(id, name, email, avatar_url)")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const ideas = await Promise.all(
      (data ?? []).map(async (idea) => {
        const { count: voteCount } = await supabaseAdmin
          .from("orbit_idea_votes")
          .select("id", { count: "exact", head: true })
          .eq("idea_id", idea.id);
        return { ...idea, voteCount: voteCount ?? 0 };
      }),
    );

    return NextResponse.json(ideas);
  } catch {
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspace, user } = await getRouteContext();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("orbit_ideas")
      .insert({
        workspace_id: workspace.id,
        project_id: body.projectId ?? null,
        title: body.title,
        description: body.description ?? null,
        priority: body.priority ?? "medium",
        category: body.category ?? null,
        status: body.status ?? "backlog",
        labels: body.labels ?? [],
        created_by: user.id,
      })
      .select("*, creator:created_by(id, name, email, avatar_url)")
      .single();

    if (error) throw error;

    // Insert assigned members
    const memberIds: string[] = body.assignedMemberIds ?? [];
    if (memberIds.length > 0) {
      const memberRows = memberIds.map((uid: string) => ({
        idea_id: data.id,
        user_id: uid,
        role: uid === user.id ? "creator" : "member",
      }));
      await supabaseAdmin.from("orbit_idea_members").insert(memberRows);
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}