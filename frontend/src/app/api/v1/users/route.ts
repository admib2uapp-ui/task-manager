import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { workspace } = await getRouteContext();

    const { data } = await supabaseAdmin
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace.id);

    if (!data || data.length === 0) return NextResponse.json([]);

    const userIds = data.map((m) => m.user_id);

    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, email, name, avatar_url")
      .in("id", userIds);

    const mapped = (users || []).map((u: Record<string, unknown>) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatar_url,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    return NextResponse.json(mapped);
  } catch {
    return unauthorized();
  }
}
