import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET(request: Request) {
  try {
    await getRouteContext();
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get("entityType");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    const { data } = await query;
    return NextResponse.json(data || []);
  } catch {
    return unauthorized();
  }
}
