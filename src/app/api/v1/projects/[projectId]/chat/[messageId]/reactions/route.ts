import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireProjectMember,
  badRequest,
} from "@/lib/supabase/route-handler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; messageId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId, messageId } = await params;

    const memberError = await requireProjectMember(user.id, projectId);
    if (memberError) return memberError;

    const body = await request.json();
    if (!body.emoji) return badRequest("Emoji is required");

    const existing = await supabaseAdmin
      .from("chat_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", body.emoji)
      .maybeSingle();

    if (existing.data) {
      await supabaseAdmin
        .from("chat_reactions")
        .delete()
        .eq("id", existing.data.id);
      return NextResponse.json({ removed: true, reactionId: existing.data.id });
    }

    const { data, error } = await supabaseAdmin
      .from("chat_reactions")
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji: body.emoji,
      })
      .select()
      .single();

    if (error) return badRequest(error.message);

    return NextResponse.json({ removed: false, reaction: data }, { status: 201 });
  } catch {
    return unauthorized();
  }
}
