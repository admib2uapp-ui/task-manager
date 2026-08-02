import { NextRequest, NextResponse } from "next/server";
import { getRouteContext } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const { id, memberId } = await params;
    await getRouteContext();

    const { error } = await supabaseAdmin
      .from("orbit_idea_members")
      .delete()
      .eq("idea_id", id)
      .eq("id", memberId);

    if (error) throw error;
    return NextResponse.json({ message: "Member removed" });
  } catch {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
