import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    await getRouteContext();

    const { data, error } = await supabaseAdmin
      .from("orbit_testing_metadata")
      .select("*, tester:tester_id(id, name, email, avatar_url)")
      .eq("task_id", taskId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return NextResponse.json(data ?? null);
  } catch {
    return NextResponse.json({ error: "Failed to fetch testing metadata" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;
    await getRouteContext();
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.qaChecklist !== undefined) updateData.qa_checklist = body.qaChecklist;
    if (body.testCases !== undefined) updateData.test_cases = body.testCases;
    if (body.passCount !== undefined) updateData.pass_count = body.passCount;
    if (body.failCount !== undefined) updateData.fail_count = body.failCount;
    if (body.bugReportIds !== undefined) updateData.bug_report_ids = body.bugReportIds;
    if (body.screenshotUrls !== undefined) updateData.screenshot_urls = body.screenshotUrls;
    if (body.screenRecordingUrls !== undefined) updateData.screen_recording_urls = body.screenRecordingUrls;
    if (body.testNotes !== undefined) updateData.test_notes = body.testNotes;
    if (body.regressionStatus !== undefined) updateData.regression_status = body.regressionStatus;
    if (body.testingProgress !== undefined) updateData.testing_progress = body.testingProgress;
    if (body.testerId !== undefined) updateData.tester_id = body.testerId;
    if (body.testedAt !== undefined) updateData.tested_at = body.testedAt;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("orbit_testing_metadata")
      .upsert(
        { task_id: taskId, ...updateData },
        { onConflict: "task_id" },
      )
      .select("*, tester:tester_id(id, name, email, avatar_url)")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to update testing metadata" }, { status: 500 });
  }
}
