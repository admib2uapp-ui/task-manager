import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  try {
    await getRouteContext();
    const body = await request.json();

    const { userId, type, title, body: notificationBody, entityType, entityId, category, metadata } = body;

    if (!userId || !type || !title) {
      return NextResponse.json(
        { detail: "userId, type, and title are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        body: notificationBody || null,
        entity_type: entityType || null,
        entity_id: entityId || null,
        category: category || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      body: data.body,
      entityType: data.entity_type,
      entityId: data.entity_id,
      isRead: data.is_read,
      category: data.category,
      metadata: data.metadata,
      readAt: data.read_at,
      createdAt: data.created_at,
    }, { status: 201 });
  } catch {
    return unauthorized();
  }
}
