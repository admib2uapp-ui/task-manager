import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireProjectMember,
  badRequest,
} from "@/lib/supabase/route-handler";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId } = await params;

    const memberError = await requireProjectMember(user.id, projectId);
    if (memberError) return memberError;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q?.trim()) return badRequest("Search query is required");

    const { data: chat } = await supabaseAdmin
      .from("project_chats")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (!chat) {
      return NextResponse.json({ messages: [] });
    }

    const { data: messages, error } = await supabaseAdmin
      .from("chat_messages")
      .select(`
        *,
        user:users(id, email, name, avatar_url),
        reactions:chat_reactions(*),
        attachments:chat_attachments(*)
      `)
      .eq("chat_id", chat.id)
      .ilike("body", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return badRequest(error.message);

    return NextResponse.json({ messages: (messages || []).map(mapSearchResult) });
  } catch {
    return unauthorized();
  }
}

function mapSearchResult(msg: Record<string, unknown>) {
  return {
    id: msg.id,
    body: msg.body,
    chatId: msg.chat_id,
    userId: msg.user_id,
    user: msg.user
      ? {
          id: (msg.user as Record<string, unknown>).id,
          email: (msg.user as Record<string, unknown>).email,
          name: (msg.user as Record<string, unknown>).name,
          avatarUrl: (msg.user as Record<string, unknown>).avatar_url,
        }
      : undefined,
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
  };
}
