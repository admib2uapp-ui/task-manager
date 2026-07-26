import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireProjectMember,
  badRequest,
} from "@/lib/supabase/route-handler";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId } = await params;

    const memberError = await requireProjectMember(user.id, projectId);
    if (memberError) return memberError;

    const { searchParams } = new URL(_request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const { data: existingChat } = await supabaseAdmin
      .from("project_chats")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();

    let chatId = existingChat?.id;

    if (!chatId) {
      const { data: newChat } = await supabaseAdmin
        .from("project_chats")
        .insert({ project_id: projectId })
        .select("id")
        .single();
      chatId = newChat?.id;
    }

    if (!chatId) return badRequest("Failed to resolve chat");

    let query = supabaseAdmin
      .from("chat_messages")
      .select(`
        *,
        user:users(id, email, name, avatar_url),
        reactions:chat_reactions(*),
        attachments:chat_attachments(*),
        mentions:chat_mentions(*),
        reply_to:chat_messages!reply_to_id(id, body, user_id, user:users(id, name)),
        thread_messages:chat_messages!thread_id(id, body, user_id, user:users(id, name), created_at)
      `)
      .eq("chat_id", chatId)
      .is("thread_id", null)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) return badRequest(error.message);

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor =
      hasMore && result.length > 0
        ? result[result.length - 1].created_at
        : null;

    const { data: pins } = await supabaseAdmin
      .from("chat_pins")
      .select("*, message:chat_messages(*, user:users(*), reactions:chat_reactions(*), attachments:chat_attachments(*))")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false });

    const { data: onlineUsers } = await supabaseAdmin
      .from("project_members")
      .select("user_id, user:users(id, email, name, avatar_url)")
      .eq("project_id", projectId);

    return NextResponse.json({
      chatId,
      messages: result.map(mapMessage),
      pins: (pins || []).map((p) => ({
        ...p,
        message: p.message ? mapMessage(p.message) : null,
      })),
      onlineUsers: onlineUsers || [],
      hasMore,
      nextCursor,
    });
  } catch {
    return unauthorized();
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { user } = await getRouteContext();
    const { projectId } = await params;

    const memberError = await requireProjectMember(user.id, projectId);
    if (memberError) return memberError;

    const body = await request.json();

    if (!body.body?.trim()) return badRequest("Message body is required");

    const { data: existingChat } = await supabaseAdmin
      .from("project_chats")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();

    let chatId = existingChat?.id;

    if (!chatId) {
      const { data: newChat } = await supabaseAdmin
        .from("project_chats")
        .insert({ project_id: projectId })
        .select("id")
        .single();
      chatId = newChat?.id;
    }

    if (!chatId) return badRequest("Failed to resolve chat");

    const { data: message, error } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        user_id: user.id,
        body: body.body.trim(),
        reply_to_id: body.replyToId || null,
        thread_id: body.threadId || null,
      })
      .select("*, user:users(id, email, name, avatar_url)")
      .single();

    if (error) return badRequest(error.message);

    if (body.mentionIds?.length) {
      const mentions = body.mentionIds.map((uid: string) => ({
        message_id: message.id,
        user_id: uid,
      }));
      await supabaseAdmin.from("chat_mentions").insert(mentions);

      for (const uid of body.mentionIds) {
        if (uid !== user.id) {
          await supabaseAdmin.from("notifications").insert({
            user_id: uid,
            type: "mention",
            title: `${user.name} mentioned you`,
            body: body.body.trim().slice(0, 200),
            entity_type: "project",
            entity_id: projectId,
          });
        }
      }
    }

    return NextResponse.json(mapMessage(message), { status: 201 });
  } catch {
    return unauthorized();
  }
}

function mapMessage(msg: Record<string, unknown>) {
  return {
    ...msg,
    user: msg.user
      ? {
          id: (msg.user as Record<string, unknown>).id,
          email: (msg.user as Record<string, unknown>).email,
          name: (msg.user as Record<string, unknown>).name,
          avatarUrl: (msg.user as Record<string, unknown>).avatar_url,
        }
      : undefined,
    replyTo: msg.reply_to
      ? {
          id: (msg.reply_to as Record<string, unknown>).id,
          body: (msg.reply_to as Record<string, unknown>).body,
          userId: (msg.reply_to as Record<string, unknown>).user_id,
          user: (msg.reply_to as Record<string, unknown>).user
            ? {
                id: ((msg.reply_to as Record<string, unknown>).user as Record<string, unknown>).id,
                name: ((msg.reply_to as Record<string, unknown>).user as Record<string, unknown>).name,
              }
            : undefined,
        }
      : undefined,
    threadMessages: (msg.thread_messages as Array<Record<string, unknown>> || []).map(
      (tm: Record<string, unknown>) => ({
        id: tm.id,
        body: tm.body,
        userId: tm.user_id,
        user: tm.user
          ? {
              id: (tm.user as Record<string, unknown>).id,
              name: (tm.user as Record<string, unknown>).name,
            }
          : undefined,
        createdAt: tm.created_at,
      }),
    ),
    reactions: (msg.reactions as Array<Record<string, unknown>> || []).map(
      (r: Record<string, unknown>) => ({
        id: r.id,
        messageId: r.message_id,
        userId: r.user_id,
        emoji: r.emoji,
        createdAt: r.created_at,
      }),
    ),
    attachments: (msg.attachments as Array<Record<string, unknown>> || []).map(
      (a: Record<string, unknown>) => ({
        id: a.id,
        messageId: a.message_id,
        fileName: a.file_name,
        storedName: a.stored_name,
        fileUrl: a.file_url,
        mimeType: a.mime_type,
        sizeBytes: a.size_bytes,
        createdAt: a.created_at,
      }),
    ),
    mentions: (msg.mentions as Array<Record<string, unknown>> || []).map(
      (m: Record<string, unknown>) => ({
        id: m.id,
        messageId: m.message_id,
        userId: m.user_id,
        createdAt: m.created_at,
      }),
    ),
    chatId: msg.chat_id,
    userId: msg.user_id,
    replyToId: msg.reply_to_id,
    threadId: msg.thread_id,
    isEdited: msg.is_edited,
    editedAt: msg.edited_at,
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
  };
}
