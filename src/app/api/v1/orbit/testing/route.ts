import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    await getRouteContext();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("orbit_testing_metadata")
      .insert({
        task_id: body.taskId,
        qa_checklist: body.qaChecklist ?? [],
        test_cases: body.testCases ?? [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create testing metadata" }, { status: 500 });
  }
}