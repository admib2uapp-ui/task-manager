import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  notFound,
} from "@/lib/supabase/route-handler";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { workspace } = await getRouteContext();
    const { taskId } = await params;

    const { data } = await supabaseAdmin
      .from("tasks")
      .select(
        `
        *,
        project:projects!inner(id, name, color, icon),
        tags:task_tags(tag:tags(*)),
        assignee:users(id, email, name, avatar_url),
        subtasks(*),
        checklist:checklist_items(*),
        comments(*, author:users(id, email, name, avatar_url)),
        attachments(*)
      `,
      )
      .eq("id", taskId)
      .eq("project.workspace_id", workspace.id)
      .single();

    if (!data) return notFound("Task");

    const { data: deps } = await supabaseAdmin
      .from("task_dependencies")
      .select("depends_on_id")
      .eq("task_id", taskId);

    return NextResponse.json({
      ...data,
      tags: (data.tags || []).map((t: Record<string, unknown>) => t.tag),
      assignee: data.assignee
        ? {
            id: (data.assignee as Record<string, unknown>).id,
            email: (data.assignee as Record<string, unknown>).email,
            name: (data.assignee as Record<string, unknown>).name,
            avatarUrl: (data.assignee as Record<string, unknown>).avatar_url,
          }
        : null,
      comments: (data.comments || []).map((c: Record<string, unknown>) => ({
        ...c,
        author: c.author
          ? {
              id: (c.author as Record<string, unknown>).id,
              email: (c.author as Record<string, unknown>).email,
              name: (c.author as Record<string, unknown>).name,
              avatarUrl: (c.author as Record<string, unknown>).avatar_url,
            }
          : undefined,
      })),
      dependencyIds: (deps || []).map(
        (d: Record<string, unknown>) => d.depends_on_id,
      ),
    });
  } catch {
    return unauthorized();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    await getRouteContext();
    const { taskId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.position !== undefined) updates.position = body.position;
    if (body.assigneeId !== undefined) updates.assignee_id = body.assigneeId;
    if (body.deadline !== undefined) updates.deadline = body.deadline;
    if (body.estimatedHours !== undefined)
      updates.estimated_hours = body.estimatedHours;
    if (body.isPinned !== undefined) updates.is_pinned = body.isPinned;

    if (body.tagIds !== undefined) {
      await supabaseAdmin.from("task_tags").delete().eq("task_id", taskId);
      if (body.tagIds.length > 0) {
        await supabaseAdmin.from("task_tags").insert(
          body.tagIds.map((tagId: string) => ({
            task_id: taskId,
            tag_id: tagId,
          })),
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select(
        `
        *,
        project:projects!inner(id, name, color, icon),
        tags:task_tags(tag:tags(*))
      `,
      )
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    if (!data) return notFound("Task");

    return NextResponse.json({
      ...data,
      tags: (data.tags || []).map((t: Record<string, unknown>) => t.tag),
    });
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    await getRouteContext();
    const { taskId } = await params;

    await supabaseAdmin.from("subtasks").delete().eq("task_id", taskId);
    await supabaseAdmin.from("checklist_items").delete().eq("task_id", taskId);
    await supabaseAdmin.from("comments").delete().eq("task_id", taskId);
    await supabaseAdmin.from("task_tags").delete().eq("task_id", taskId);
    await supabaseAdmin
      .from("task_dependencies")
      .delete()
      .eq("task_id", taskId);
    await supabaseAdmin.from("tasks").delete().eq("id", taskId);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
