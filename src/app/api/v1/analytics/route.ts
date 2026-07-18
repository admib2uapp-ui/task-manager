import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { workspace } = await getRouteContext();

    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("status, priority, created_at, deadline, project_id")
      .eq("project.workspace_id", workspace.id);

    const allTasks = tasks || [];

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "done").length;
    const pendingTasks = allTasks.filter((t) => t.status !== "done").length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const statusDistribution = [
      "backlog",
      "todo",
      "in_progress",
      "review",
      "done",
    ].map((status) => ({
      label: status,
      count: allTasks.filter((t) => t.status === status).length,
    }));

    const priorityDistribution = ["critical", "high", "medium", "low"].map(
      (priority) => ({
        label: priority,
        count: allTasks.filter((t) => t.priority === priority).length,
      }),
    );

    const days: string[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
      );
      days.push(d.toISOString().split("T")[0]);
    }

    const completedPerDay = days.map((day) => ({
      date: day,
      value: allTasks.filter(
        (t) => t.status === "done" && t.created_at?.startsWith(day),
      ).length,
    }));

    const { data: timeEntries } = await supabaseAdmin
      .from("time_entries")
      .select("started_at, duration_seconds")
      .eq("task.project.workspace_id", workspace.id);

    const hoursPerDay = days.map((day) => {
      const totalSeconds = (timeEntries || [])
        .filter((te) => te.started_at?.startsWith(day))
        .reduce((sum, te) => sum + (te.duration_seconds || 0), 0);
      return { date: day, value: totalSeconds };
    });

    const { data: completedWithTimes } = await supabaseAdmin
      .from("tasks")
      .select("created_at, deadline")
      .eq("project.workspace_id", workspace.id)
      .eq("status", "done");

    const completionHours = (completedWithTimes || [])
      .map((t) => {
        if (!t.created_at || !t.deadline) return null;
        const start = new Date(t.created_at).getTime();
        const end = new Date(t.deadline).getTime();
        return (end - start) / (1000 * 60 * 60);
      })
      .filter((h): h is number => h !== null && h >= 0);

    const avgCompletionHours =
      completionHours.length > 0
        ? Math.round(
            (completionHours.reduce((a, b) => a + b, 0) /
              completionHours.length) *
              10,
          ) / 10
        : 0;

    return NextResponse.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      avgCompletionHours,
      statusDistribution,
      priorityDistribution,
      completedPerDay,
      hoursPerDay,
    });
  } catch {
    return unauthorized();
  }
}
