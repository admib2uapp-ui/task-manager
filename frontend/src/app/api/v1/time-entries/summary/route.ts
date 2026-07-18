import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user } = await getRouteContext();

    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ).toISOString();
    const weekStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - now.getUTCDay(),
      ),
    ).toISOString();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    ).toISOString();

    const { data: allEntries } = await supabaseAdmin
      .from("time_entries")
      .select("duration_seconds, project_id, started_at")
      .eq("user_id", user.id)
      .gte("started_at", monthStart);

    const entries = allEntries || [];

    const todaySeconds = entries
      .filter((e) => e.started_at >= todayStart)
      .reduce((sum, e) => sum + (e.duration_seconds || 0), 0);

    const weekSeconds = entries
      .filter((e) => e.started_at >= weekStart)
      .reduce((sum, e) => sum + (e.duration_seconds || 0), 0);

    const monthSeconds = entries.reduce(
      (sum, e) => sum + (e.duration_seconds || 0),
      0,
    );

    const projectMap: Record<string, number> = {};
    for (const e of entries) {
      if (e.project_id) {
        projectMap[e.project_id] =
          (projectMap[e.project_id] || 0) + (e.duration_seconds || 0);
      }
    }

    const perProject = await Promise.all(
      Object.entries(projectMap).map(async ([projectId, seconds]) => {
        const { data: p } = await supabaseAdmin
          .from("projects")
          .select("id, name, color, icon")
          .eq("id", projectId)
          .maybeSingle();
        return {
          projectId,
          projectName: p?.name || "Unknown",
          color: p?.color || "#3b82f6",
          icon: p?.icon || "Folder",
          seconds,
        };
      }),
    );

    return NextResponse.json({
      today: { seconds: todaySeconds },
      week: { seconds: weekSeconds },
      month: { seconds: monthSeconds },
      perProject,
    });
  } catch {
    return unauthorized();
  }
}
