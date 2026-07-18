import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user, workspace } = await getRouteContext();

    const today = new Date().toISOString().split("T")[0];

    const { count: totalProjects } = await supabaseAdmin
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
      .select("id, name, color, icon, status, deadline")
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

    const { count: overdueTasks } = await supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("assignee_id", user.id)
      .not("status", "eq", "done")
      .not("deadline", "is", null)
      .lt("deadline", today);

    return NextResponse.json({
      stats: {
        totalProjects: totalProjects || 0,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        overdueTasks: overdueTasks || 0,
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
