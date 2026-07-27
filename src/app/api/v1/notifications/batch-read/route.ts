import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  try {
    const { user } = await getRouteContext();
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { detail: "ids must be a non-empty array" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true, read_at: now })
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return unauthorized();
  }
}
