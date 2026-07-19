import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  getUserWorkspaceRole,
  unauthorized,
} from "@/lib/supabase/route-handler";

export async function GET() {
  try {
    const { user, workspace } = await getRouteContext();
    const workspaceRole = await getUserWorkspaceRole(user.id, workspace.id);
    return NextResponse.json({ ...user, workspaceRole });
  } catch {
    return unauthorized();
  }
}

export async function PATCH(request: Request) {
  try {
    const { user: ctxUser } = await getRouteContext();
    const body = await request.json();
    const { name, avatarUrl } = body;

    const metadata: Record<string, unknown> = {};
    if (name !== undefined) metadata.name = name;
    if (avatarUrl !== undefined) metadata.avatar_url = avatarUrl;

    if (Object.keys(metadata).length > 0) {
      const { data: authUser, error } =
        await supabaseAdmin.auth.admin.updateUserById(ctxUser.id, {
          user_metadata: metadata,
        });
      if (error) {
        return NextResponse.json({ detail: error.message }, { status: 400 });
      }
      return NextResponse.json({
        ...ctxUser,
        name: authUser.user.user_metadata?.name ?? ctxUser.name,
        avatarUrl:
          (authUser.user.user_metadata?.avatar_url as string) ??
          ctxUser.avatarUrl,
      });
    }

    return NextResponse.json(ctxUser);
  } catch {
    return unauthorized();
  }
}
