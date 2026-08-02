import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await getRouteContext();

    const { data, error } = await supabaseAdmin
      .from("orbit_idea_members")
      .select("*, user:user_id(id, name, email, avatar_url)")
      .eq("idea_id", id);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getRouteContext();
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("orbit_idea_members")
      .insert({
        idea_id: id,
        user_id: body.userId,
        role: body.role ?? (body.userId === user.id ? "creator" : "member"),
      })
      .select("*, user:user_id(id, name, email, avatar_url)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already a member" });
      }
      throw error;
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
