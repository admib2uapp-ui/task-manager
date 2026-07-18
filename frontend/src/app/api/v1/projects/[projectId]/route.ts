import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  notFound,
} from "@/lib/supabase/route-handler";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { workspace } = await getRouteContext();
    const { projectId } = await params;

    const { data } = await supabaseAdmin
      .from("projects")
      .select(
        `
        *,
        tags:project_tags(tag:tags(*)),
        milestones(*)
      `,
      )
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .single();

    if (!data) return notFound("Project");

    const { count: taskCount } = await supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    const { count: completedTaskCount } = await supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "done");

    return NextResponse.json({
      id: data.id,
      workspaceId: data.workspace_id,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      status: data.status,
      deadline: data.deadline,
      repositoryUrl: data.repository_url,
      isFavorite: data.is_favorite,
      isArchived: data.is_archived,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: (data.tags || []).map(
        (t: Record<string, unknown>) => t.tag as Record<string, unknown>,
      ),
      milestones: data.milestones,
      taskCount: taskCount ?? 0,
      completedTaskCount: completedTaskCount ?? 0,
      milestoneCount: (data.milestones as Array<unknown>)?.length ?? 0,
      completedMilestoneCount:
        (data.milestones as Array<Record<string, unknown>>)?.filter(
          (m) => m.completed,
        )?.length ?? 0,
      progress:
        taskCount && taskCount > 0
          ? Math.round(((completedTaskCount ?? 0) / taskCount) * 100)
          : 0,
    });
  } catch {
    return unauthorized();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { workspace } = await getRouteContext();
    const { projectId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.status !== undefined) updates.status = body.status;
    if (body.deadline !== undefined) updates.deadline = body.deadline;
    if (body.isFavorite !== undefined) updates.is_favorite = body.isFavorite;
    if (body.isArchived !== undefined) updates.is_archived = body.isArchived;

    const { data, error } = await supabaseAdmin
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .eq("workspace_id", workspace.id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    if (!data) return notFound("Project");

    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { workspace } = await getRouteContext();
    const { projectId } = await params;

    await supabaseAdmin.from("tasks").delete().eq("project_id", projectId);

    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("workspace_id", workspace.id);

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
