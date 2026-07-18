import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user, workspace } = await getRouteContext();

    const today = new Date().toISOString().split("T")[0];

    const { count: activeProjects } = await supabaseAdmin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("is_archived", false);

    const { count: totalTasks } = await supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project.workspace_id", workspace.id);

    const { count: completedTasks } = await supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project.workspace_id", workspace.id)
      .eq("status", "done");

    const { count: dueToday } = await supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project.workspace_id", workspace.id)
      .eq("deadline", today);

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

    const { data: recentProjects } = await supabaseAdmin
      .from("projects")
      .select("id, name, color, icon, status, deadline, created_at, updated_at")
      .eq("workspace_id", workspace.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(5);

    const { data: recentTasks } = await supabaseAdmin
      .from("tasks")
      .select(
        "id, title, status, priority, created_at, project:projects(id, name, color)",
      )
      .eq("project.workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(5);

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
