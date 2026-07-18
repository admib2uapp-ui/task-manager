import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { notificationId } = await params;

    await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch {
    return unauthorized();
  }
}
