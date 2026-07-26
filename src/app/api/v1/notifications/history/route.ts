import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRouteContext, unauthorized } from "@/lib/supabase/route-handler";

function mapNotification(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: row.is_read,
    category: row.category,
    metadata: row.metadata,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    const { user } = await getRouteContext();
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const type = searchParams.get("type");

    let query = supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    const hasMore = data ? data.length > limit : false;
    const rows = hasMore ? data.slice(0, limit) : (data ?? []);
    const nextCursor =
      hasMore && rows.length > 0
        ? rows[rows.length - 1].created_at
        : null;

    return NextResponse.json({
      items: rows.map(mapNotification),
      nextCursor,
      hasMore,
      total: count ?? 0,
    });
  } catch {
    return unauthorized();
  }
}
