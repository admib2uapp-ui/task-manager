import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireRole,
} from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user, workspace } = await getRouteContext();

    const roleError = await requireRole(["senior"], user.id, workspace.id);
    if (roleError) return roleError;

    const { data: juniorMemberships } = await supabaseAdmin
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace.id)
      .eq("role", "junior");

    if (!juniorMemberships || juniorMemberships.length === 0) {
      return NextResponse.json({ juniors: [] });
    }

    const juniorIds = juniorMemberships.map((m) => m.user_id);

    const { data: juniorUsers } = await supabaseAdmin
      .from("users")
      .select("id, name, email, avatar_url")
      .in("id", juniorIds);

    const userMap = new Map(
      (juniorUsers || []).map((u) => [u.id, u]),
    );

    const juniorProgress = await Promise.all(
      juniorIds.map(async (juniorId) => {
        const userProfile = userMap.get(juniorId);

        const { data: tasks } = await supabaseAdmin
          .from("tasks")
          .select(
            `
            id, title, status, priority, deadline, created_at,
            project:projects!inner(id, name, color, icon, workspace_id),
            comments(*, author:users(id, name, avatar_url))
          `,
          )
          .eq("assignee_id", juniorId)
          .eq("project.workspace_id", workspace.id)
          .order("created_at", { ascending: false });

        const safeTasks = (tasks || []).map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          deadline: t.deadline,
          createdAt: t.created_at,
          project: t.project
            ? {
                id: (t.project as unknown as Record<string, unknown>).id,
                name: (t.project as unknown as Record<string, unknown>).name,
                color: (t.project as unknown as Record<string, unknown>).color,
                icon: (t.project as unknown as Record<string, unknown>).icon,
              }
            : null,
          comments: ((t.comments as Array<Record<string, unknown>>) || []).map(
            (c) => ({
              id: c.id,
              content: c.content,
              createdAt: c.created_at,
              author: c.author
                ? {
                    id: (c.author as unknown as Record<string, unknown>).id,
                    name: (c.author as unknown as Record<string, unknown>).name,
                    avatarUrl: (c.author as unknown as Record<string, unknown>).avatar_url,
                  }
                : null,
            }),
          ),
        }));

        return {
          user: userProfile
            ? {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                avatarUrl: userProfile.avatar_url,
              }
            : null,
          taskCount: safeTasks.length,
          completedCount: safeTasks.filter((t) => t.status === "done").length,
          tasks: safeTasks,
        };
      }),
    );

    return NextResponse.json({ juniors: juniorProgress });
  } catch {
    return unauthorized();
  }
}
