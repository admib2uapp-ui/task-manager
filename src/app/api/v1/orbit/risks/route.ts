import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    await getRouteContext();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("orbit_risk_nodes")
      .select("*, owner:owner_id(id, name, email, avatar_url)")
      .eq("project_id", projectId)
      .order("risk_score", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch risks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await getRouteContext();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("orbit_risk_nodes")
      .insert({
        project_id: body.projectId,
        entity_type: body.entityType,
        entity_id: body.entityId,
        risk_score: body.riskScore ?? 0,
        risk_type: body.riskType,
        owner_id: body.ownerId ?? null,
        resolution_suggestion: body.resolutionSuggestion ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create risk node" }, { status: 500 });
  }
}