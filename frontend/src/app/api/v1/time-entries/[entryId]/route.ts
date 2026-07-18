import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    await getRouteContext();
    const { entryId } = await params;

    await supabaseAdmin.from("time_entries").delete().eq("id", entryId);
    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
