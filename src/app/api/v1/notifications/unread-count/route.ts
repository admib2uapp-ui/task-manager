import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user } = await getRouteContext();

    const { count, error } = await supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw error;

    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return unauthorized();
  }
}
