import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    await getRouteContext();
    const body = await request.json();

    if (!body.ideaId || !body.taskId) {
      return NextResponse.json({ error: "ideaId and taskId are required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("orbit_card_links")
      .insert({ idea_id: body.ideaId, task_id: body.taskId });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Link already exists" });
      }
      throw error;
    }

    // Update the idea's related_task_ids
    await supabaseAdmin
      .from("orbit_ideas")
      .update({ related_task_ids: supabaseAdmin.rpc("array_append_unique", {
        arr: supabaseAdmin.rpc("coalesce", { arr: null, default_arr: [] }),
        elem: body.taskId,
      })})
      .eq("id", body.ideaId);

    return NextResponse.json({ message: "Idea linked to task" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to link idea to task" }, { status: 500 });
  }
}