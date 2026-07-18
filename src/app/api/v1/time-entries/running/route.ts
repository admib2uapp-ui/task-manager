import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user } = await getRouteContext();

    const { data } = await supabaseAdmin
      .from("time_entries")
      .select(
        "*, task:tasks(id, title, project_id), project:projects(id, name, color, icon)",
      )
      .eq("user_id", user.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}
