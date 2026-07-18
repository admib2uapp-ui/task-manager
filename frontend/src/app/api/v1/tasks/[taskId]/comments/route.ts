import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { taskId } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert({
        task_id: taskId,
        author_id: user.id,
        body: body.body,
      })
      .select("*, author:users(id, email, name, avatar_url)")
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });

    const { data: task } = await supabaseAdmin
      .from("tasks")
      .select("assignee_id, project_id")
      .eq("id", taskId)
      .single();

    if (task?.assignee_id && task.assignee_id !== user.id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: task.assignee_id,
        type: "comment",
        title: `New comment on task`,
        body: body.body?.slice(0, 200) || "",
        entity_type: "task",
        entity_id: taskId,
      });
    }

    return NextResponse.json(
      {
        ...data,
        author: data.author
          ? {
              id: (data.author as Record<string, unknown>).id,
              email: (data.author as Record<string, unknown>).email,
              name: (data.author as Record<string, unknown>).name,
              avatarUrl: (data.author as Record<string, unknown>).avatar_url,
            }
          : undefined,
      },
      { status: 201 },
    );
  } catch {
    return unauthorized();
  }
}
