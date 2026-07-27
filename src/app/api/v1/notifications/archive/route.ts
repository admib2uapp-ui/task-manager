import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  try {
    const { user } = await getRouteContext();
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { detail: "ids must be a non-empty array" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return unauthorized();
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await getRouteContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { detail: "id query parameter is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
