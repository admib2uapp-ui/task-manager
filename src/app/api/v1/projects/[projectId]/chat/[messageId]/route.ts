import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireProjectMember,
  badRequest,
  notFound,
  forbidden,
} from "@/lib/supabase/route-handler";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; messageId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId, messageId } = await params;

    const memberError = await requireProjectMember(user.id, projectId);
    if (memberError) return memberError;

    const { data: message } = await supabaseAdmin
      .from("chat_messages")
      .select("user_id, chat_id")
      .eq("id", messageId)
      .single();

    if (!message) return notFound("Message");
    if (message.user_id !== user.id) return forbidden("You can only edit your own messages");

    const body = await request.json();
    if (!body.body?.trim()) return badRequest("Message body is required");

    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .update({ body: body.body.trim(), is_edited: true, edited_at: new Date().toISOString() })
      .eq("id", messageId)
      .select("*, user:users(id, email, name, avatar_url)")
      .single();

    if (error) return badRequest(error.message);

    return NextResponse.json(data);
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

    const { data: message } = await supabaseAdmin
      .from("chat_messages")
      .select("user_id, chat_id")
      .eq("id", messageId)
      .single();

    if (!message) return notFound("Message");

    const { data: member } = await supabaseAdmin
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    const isOwner = member?.role === "owner";
    const isSenior = member?.role === "senior";
    const isOwn = message.user_id === user.id;

    if (!isOwn && !isOwner && !isSenior) {
      return forbidden("Only owners and seniors can delete other members' messages");
    }

    const { error } = await supabaseAdmin
      .from("chat_messages")
      .delete()
      .eq("id", messageId);

    if (error) return badRequest(error.message);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
