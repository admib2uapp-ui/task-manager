import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await getRouteContext();
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.riskScore !== undefined) updateData.risk_score = body.riskScore;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.ownerId !== undefined) updateData.owner_id = body.ownerId;
    if (body.resolutionSuggestion !== undefined) updateData.resolution_suggestion = body.resolutionSuggestion;
    if (body.riskTimeline !== undefined) updateData.risk_timeline = body.riskTimeline;

    const { data, error } = await supabaseAdmin
      .from("orbit_risk_nodes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to update risk node" }, { status: 500 });
  }
}
