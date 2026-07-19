import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  getUserWorkspaceRole,
  unauthorized,
} from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user, workspace } = await getRouteContext();
    const role = await getUserWorkspaceRole(user.id, workspace.id);

    const today = new Date().toISOString().split("T")[0];

    let memberProjectIds: string[] = [];
    if (role === "general") {
      const { data: memberProjects } = await supabaseAdmin
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);
      memberProjectIds = (memberProjects || []).map((m) => m.project_id);
    }

    let juniorIds: string[] = [];
    if (role === "senior") {
      const { data: juniorMemberships } = await supabaseAdmin
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspace.id)
        .eq("role", "junior");
      juniorIds = (juniorMemberships || []).map((m) => m.user_id);
    }

    function applyTaskFilter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query: any,
    ) {
      if (role === "owner") return query;
      if (role === "senior") {
        return query.in("assignee_id", [user.id, ...juniorIds]);
      }
      query = query.eq("assignee_id", user.id);
      if (role === "general" && memberProjectIds.length > 0) {
        query = query.in("project_id", memberProjectIds);
      }
      if (role === "general" && memberProjectIds.length === 0) {
        query = query.in("project_id", []);
      }
      return query;
    }

    let activeProjectsQuery = supabaseAdmin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("is_archived", false);
    if (role === "general") {
      activeProjectsQuery = activeProjectsQuery.in(
        "id",
        memberProjectIds.length > 0 ? memberProjectIds : [],
      );
    }
    const { count: activeProjects } = await activeProjectsQuery;

    let totalTasksQuery = supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project.workspace_id", workspace.id);
    totalTasksQuery = applyTaskFilter(totalTasksQuery);
    const { count: totalTasks } = await totalTasksQuery;

    let completedTasksQuery = supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project.workspace_id", workspace.id)
      .eq("status", "done");
    completedTasksQuery = applyTaskFilter(completedTasksQuery);
    const { count: completedTasks } = await completedTasksQuery;

    let dueTodayQuery = supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project.workspace_id", workspace.id)
      .eq("deadline", today);
    dueTodayQuery = applyTaskFilter(dueTodayQuery);
    const { count: dueToday } = await dueTodayQuery;

    const { count: overdueTasks } = await supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("assignee_id", user.id)
      .not("status", "eq", "done")
      .not("deadline", "is", null)
      .lt("deadline", today);

    const { data: todayEntries } = await supabaseAdmin
      .from("time_entries")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .gte("started_at", today);

    const trackedTodaySeconds = (todayEntries || []).reduce(
      (sum, e) => sum + (e.duration_seconds || 0),
      0,
    );

    const { data: myTasks } = await supabaseAdmin
      .from("tasks")
      .select(
        "id, title, status, priority, deadline, project:projects(id, name, color, icon)",
      )
      .eq("assignee_id", user.id)
      .not("status", "eq", "done")
      .order("deadline", { ascending: true })
      .limit(10);

    const { data: upcomingTasks } = await supabaseAdmin
      .from("tasks")
      .select(
        "id, title, status, priority, deadline, project:projects(id, name, color, icon)",
      )
      .eq("assignee_id", user.id)
      .not("status", "eq", "done")
      .not("deadline", "is", null)
      .gte("deadline", today)
      .order("deadline", { ascending: true })
      .limit(5);

    let recentProjectsQuery = supabaseAdmin
      .from("projects")
      .select("id, name, color, icon, status, deadline, created_at, updated_at")
      .eq("workspace_id", workspace.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(5);
    if (role === "general") {
      recentProjectsQuery = recentProjectsQuery.in(
        "id",
        memberProjectIds.length > 0 ? memberProjectIds : [],
      );
    }
    const { data: recentProjects } = await recentProjectsQuery;

    let recentTasksQuery = supabaseAdmin
      .from("tasks")
      .select(
        "id, title, status, priority, created_at, project:projects(id, name, color)",
      )
      .eq("project.workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentTasksQuery = applyTaskFilter(recentTasksQuery);
    const { data: recentTasks } = await recentTasksQuery;

    const pendingTasks = (totalTasks || 0) - (completedTasks || 0);

    return NextResponse.json({
      stats: {
        activeProjects: activeProjects || 0,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        pendingTasks,
        overdueTasks: overdueTasks || 0,
        dueToday: dueToday || 0,
        trackedTodaySeconds,
        completionRate:
          totalTasks && totalTasks > 0
            ? Math.round(((completedTasks || 0) / totalTasks) * 100)
            : 0,
      },
      todayTasks: myTasks || [],
      upcomingDeadlines: upcomingTasks || [],
      recentProjects: recentProjects || [],
      recentTasks: recentTasks || [],
    });
  } catch {
    return unauthorized();
  }
}
