import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getRouteContext();

    const { data, error } = await supabaseAdmin
      .from("orbit_idea_votes")
      .insert({ idea_id: id, user_id: user.id })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already voted" });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getRouteContext();

    const { error } = await supabaseAdmin
      .from("orbit_idea_votes")
      .delete()
      .eq("idea_id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ message: "Vote removed" });
  } catch {
    return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 });
  }
}
