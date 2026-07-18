import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST() {
  try {
    const { user } = await getRouteContext();

    const now = new Date().toISOString();

    const { data: running } = await supabaseAdmin
      .from("time_entries")
      .select("id, started_at")
      .eq("user_id", user.id)
      .is("ended_at", null)
      .limit(1)
      .maybeSingle();

    if (running) {
      const startedAt = new Date(running.started_at).getTime();
      const durationSeconds = Math.round((Date.now() - startedAt) / 1000);

      await supabaseAdmin
        .from("time_entries")
        .update({ ended_at: now, duration_seconds: durationSeconds })
        .eq("id", running.id);
    }

    return NextResponse.json({ stopped: true });
  } catch {
    return unauthorized();
  }
}
