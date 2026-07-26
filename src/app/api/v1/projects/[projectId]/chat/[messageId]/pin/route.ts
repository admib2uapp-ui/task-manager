import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireProjectMember,
  badRequest,
  forbidden,
} from "@/lib/supabase/route-handler";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; messageId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId, messageId } = await params;

    const memberError = await requireProjectMember(user.id, projectId);
    if (memberError) return memberError;

    const { data: chat } = await supabaseAdmin
      .from("project_chats")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (!chat) return forbidden("Chat not found");

    const { data: message } = await supabaseAdmin
      .from("chat_messages")
      .select("id")
      .eq("id", messageId)
      .single();

    if (!message) return forbidden("Message not found");

    const existing = await supabaseAdmin
      .from("chat_pins")
      .select("id")
      .eq("chat_id", chat.id)
      .eq("message_id", messageId)
      .maybeSingle();

    if (existing.data) {
      return NextResponse.json({ pinned: true, message: "Already pinned" });
    }

    const { error } = await supabaseAdmin
      .from("chat_pins")
      .insert({
        chat_id: chat.id,
        message_id: messageId,
        pinned_by: user.id,
      });

    if (error) return badRequest(error.message);

    return NextResponse.json({ pinned: true }, { status: 201 });
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; messageId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId, messageId } = await params;

    const memberError = await requireProjectMember(user.id, projectId);
    if (memberError) return memberError;

    const { data: chat } = await supabaseAdmin
      .from("project_chats")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (!chat) return forbidden("Chat not found");

    const { error } = await supabaseAdmin
      .from("chat_pins")
      .delete()
      .eq("chat_id", chat.id)
      .eq("message_id", messageId);

    if (error) return badRequest(error.message);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
