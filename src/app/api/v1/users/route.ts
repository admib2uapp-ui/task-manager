import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  ROLE_MAP,
  unauthorized,
} from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { workspace } = await getRouteContext();

    const { data: memberships } = await supabaseAdmin
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", workspace.id);

    if (!memberships || memberships.length === 0)
      return NextResponse.json([]);

    const roleByUserId = new Map(
      memberships.map((m) => [m.user_id, ROLE_MAP[m.role] ?? m.role]),
    );

    const userIds = memberships.map((m) => m.user_id);

    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, email, name, avatar_url")
      .in("id", userIds);

    const mapped = (users || []).map((u: Record<string, unknown>) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatar_url,
      workspaceRole: roleByUserId.get(u.id as string) ?? null,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    return NextResponse.json(mapped);
  } catch {
    return unauthorized();
  }
}
