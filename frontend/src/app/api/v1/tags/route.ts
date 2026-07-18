import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { workspace } = await getRouteContext();

    const { data } = await supabaseAdmin
      .from("tags")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("name", { ascending: true });

    return NextResponse.json(data || []);
  } catch {
    return unauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const { workspace } = await getRouteContext();
    const body = await request.json();

    const { data: existing } = await supabaseAdmin
      .from("tags")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("name", body.name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { detail: "Tag with this name already exists" },
        { status: 409 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("tags")
      .insert({
        workspace_id: workspace.id,
        name: body.name,
        color: body.color || "#3b82f6",
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
