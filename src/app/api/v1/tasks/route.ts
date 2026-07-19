import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireRole,
  getUserWorkspaceRole,
  insertAuditLog,
} from "@/lib/supabase/route-handler";

export async function GET(request: Request) {
  try {
    const { user, workspace } = await getRouteContext();
    const { searchParams } = new URL(request.url);

    const role = await getUserWorkspaceRole(user.id, workspace.id);

    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const search = searchParams.get("search");

    let query = supabaseAdmin
      .from("tasks")
      .select(
        `
        *,
        project:projects!inner(id, name, color, icon),
        tags:task_tags(tag:tags(*)),
        assignee:users(id, email, name, avatar_url)
      `,
      )
      .eq("project.workspace_id", workspace.id)
      .order("position", { ascending: true });

    if (projectId) query = query.eq("project_id", projectId);

    // Task visibility by role
    if (role !== "owner") {
      // Senior: own tasks + junior users' tasks (read-only)
      if (role === "senior") {
        const { data: juniorMemberships } = await supabaseAdmin
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", workspace.id)
          .eq("role", "junior");

        const juniorIds = (juniorMemberships || []).map((m) => m.user_id);
        const visibleIds = [user.id, ...juniorIds];
        query = query.in("assignee_id", visibleIds);
      } else {
        // Junior/General: only own tasks
        query = query.eq("assignee_id", user.id);

        // General additionally restricted to member projects
        if (role === "general") {
          const { data: memberProjectIds } = await supabaseAdmin
            .from("project_members")
            .select("project_id")
            .eq("user_id", user.id);
          const ids = (memberProjectIds || []).map((m) => m.project_id);
          query = query.in("project_id", ids.length > 0 ? ids : []);
        }
      }
    }

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (assigneeId) query = query.eq("assignee_id", assigneeId);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data } = await query;
    const tasks = (data || []).map((t: Record<string, unknown>) => ({
      ...t,
      tags: ((t.tags as Array<Record<string, unknown>>) || []).map(
        (x: Record<string, unknown>) => x.tag,
      ),
      assignee: t.assignee
        ? {
            id: (t.assignee as Record<string, unknown>).id,
            email: (t.assignee as Record<string, unknown>).email,
            name: (t.assignee as Record<string, unknown>).name,
            avatarUrl: (t.assignee as Record<string, unknown>).avatar_url,
          }
        : null,
    }));

    return NextResponse.json(tasks);
  } catch {
    return unauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const { user, workspace } = await getRouteContext();

    const roleError = await requireRole(["owner"], user.id, workspace);
    if (roleError) return roleError;

    const body = await request.json();

    const { data: maxPos } = await supabaseAdmin
      .from("tasks")
      .select("position")
      .eq("project_id", body.projectId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPos = (maxPos?.[0]?.position ?? 0) + 1024;

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        project_id: body.projectId,
        title: body.title,
        description: body.description || null,
        status: body.status || "backlog",
        priority: body.priority || "medium",
        position: nextPos,
        assignee_id: body.assigneeId || null,
        deadline: body.deadline || null,
        estimated_hours: body.estimatedHours || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });

    if (body.tagIds?.length > 0) {
      await supabaseAdmin.from("task_tags").insert(
        body.tagIds.map((tagId: string) => ({
          task_id: data.id,
          tag_id: tagId,
        })),
      );
    }

    if (body.assigneeId) {
      const { data: existingMember } = await supabaseAdmin
        .from("project_members")
        .select("id")
        .eq("project_id", body.projectId)
        .eq("user_id", body.assigneeId)
        .maybeSingle();
      if (!existingMember) {
        await supabaseAdmin.from("project_members").insert({
          project_id: body.projectId,
          user_id: body.assigneeId,
          role: "general",
        });
      }
    }

    await insertAuditLog({
      userId: user.id,
      action: "CREATE_TASK",
      entityType: "Task",
      entityId: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
