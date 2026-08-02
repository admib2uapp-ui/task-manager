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
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("orbit_idea_reactions")
      .insert({ idea_id: id, user_id: user.id, emoji: body.emoji })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        await supabaseAdmin
          .from("orbit_idea_reactions")
          .delete()
          .eq("idea_id", id)
          .eq("user_id", user.id)
          .eq("emoji", body.emoji);
        return NextResponse.json({ message: "Reaction removed" });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
  }
}
