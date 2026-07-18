import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string; dependsOnId: string }> },
) {
  try {
    await getRouteContext();
    const { taskId, dependsOnId } = await params;

    await supabaseAdmin
      .from("task_dependencies")
      .delete()
      .eq("task_id", taskId)
      .eq("depends_on_id", dependsOnId);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
