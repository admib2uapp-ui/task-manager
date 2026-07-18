import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string; commentId: string }> },
) {
  try {
    await getRouteContext();
    const { commentId } = await params;

    await supabaseAdmin.from("comments").delete().eq("id", commentId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
