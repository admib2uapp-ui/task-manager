import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    await getRouteContext();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabaseAdmin
      .from("project_analytics_snapshots")
      .select("*")
      .eq("project_id", projectId)
      .eq("snapshot_date", today)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (data) {
      return NextResponse.json(data);
    }

    // Compute on-the-fly if no snapshot exists yet
    const snapshot = await computeAnalytics(projectId);
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

async function computeAnalytics(projectId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("id, status, time_spent_seconds, created_at, updated_at")
    .eq("project_id", projectId);

  const all = tasks ?? [];
  const total = all.length || 1;
  const dev = all.filter((t) => t.status === "in_progress").length / total;
  const testing = all.filter((t) => t.status === "review").length / total;
  const review = all.filter((t) => t.status === "review").length / total;
  const done = all.filter((t) => t.status === "done").length;
  const donePct = done / total;

  const analytics = {
    projectProgress: Math.round(donePct * 100),
    developmentProgress: Math.round(dev * 100),
    testingProgress: Math.round(testing * 100),
    reviewProgress: Math.round(review * 100),
    completedPercentage: Math.round(donePct * 100),
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

  const { data: snapshot, error } = await supabaseAdmin
    .from("project_analytics_snapshots")
    .insert({
      project_id: projectId,
      snapshot_date: today,
      data: analytics,
    })
    .select()
    .single();

  if (error) throw error;
  return snapshot;
}