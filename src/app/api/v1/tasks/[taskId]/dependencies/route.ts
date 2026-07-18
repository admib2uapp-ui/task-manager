import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    await getRouteContext();
    const { taskId } = await params;
    const body = await request.json();

    if (body.dependsOnId === taskId) {
      return NextResponse.json(
        { detail: "Task cannot depend on itself" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("task_dependencies")
      .insert({ task_id: taskId, depends_on_id: body.dependsOnId })
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
