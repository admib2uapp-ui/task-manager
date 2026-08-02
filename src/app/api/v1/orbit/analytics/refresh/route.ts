import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = body.projectId;
    await getRouteContext();

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Recalculate analytics snapshot
    const today = new Date().toISOString().split("T")[0];

    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("id, status, time_spent_seconds")
      .eq("project_id", projectId);

    const all = tasks ?? [];
    const total = all.length || 1;
    const done = all.filter((t) => t.status === "done").length;

    const analytics = {
      projectProgress: Math.round((done / total) * 100),
      developmentProgress: Math.round((all.filter((t) => t.status === "in_progress").length / total) * 100),
      testingProgress: Math.round((all.filter((t) => t.status === "review").length / total) * 100),
      reviewProgress: Math.round((all.filter((t) => t.status === "review").length / total) * 100),
      completedPercentage: Math.round((done / total) * 100),
      velocity: Math.round(done / 4),
      cycleTime: 0,
      leadTime: 0,
      riskScore: 0,
      teamProductivity: 75,
      aiHealthScore: 85,
      githubHealthScore: 70,
      sprintMetrics: {
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        remainingStoryPoints: 0,
        sprintDay: 1,
        totalSprintDays: 14,
      },
      burndown: [],
      lastUpdated: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("project_analytics_snapshots")
      .upsert(
        { project_id: projectId, snapshot_date: today, data: analytics },
        { onConflict: "project_id, snapshot_date" },
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to refresh analytics" }, { status: 500 });
  }
}