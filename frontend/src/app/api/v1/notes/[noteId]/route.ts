import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  notFound,
  requireOwnership,
  insertAuditLog,
} from "@/lib/supabase/route-handler";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { workspace } = await getRouteContext();
    const { noteId } = await params;

    const { data } = await supabaseAdmin
      .from("notes")
      .select("*, creator:users!notes_created_by_fkey(id, email, name, avatar_url), updater:users!notes_updated_by_fkey(id, email, name, avatar_url)")
      .eq("id", noteId)
      .eq("workspace_id", workspace.id)
      .single();

    if (!data) return notFound("Note");

    return NextResponse.json({
      id: data.id,
      workspaceId: data.workspace_id,
      projectId: data.project_id,
      title: data.title,
      content: data.content,
      createdBy: data.created_by,
      creator: data.creator
        ? {
            id: (data.creator as Record<string, unknown>).id,
            email: (data.creator as Record<string, unknown>).email,
            name: (data.creator as Record<string, unknown>).name,
            avatarUrl: (data.creator as Record<string, unknown>).avatar_url,
          }
        : null,
      updatedBy: data.updated_by,
      updater: data.updater
        ? {
            id: (data.updater as Record<string, unknown>).id,
            email: (data.updater as Record<string, unknown>).email,
            name: (data.updater as Record<string, unknown>).name,
            avatarUrl: (data.updater as Record<string, unknown>).avatar_url,
          }
        : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch {
    return unauthorized();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { user, workspace } = await getRouteContext();
    const { noteId } = await params;
    const body = await request.json();

    const { data: existing } = await supabaseAdmin
      .from("notes")
      .select("created_by")
      .eq("id", noteId)
      .eq("workspace_id", workspace.id)
      .single();

    if (!existing) return notFound("Note");

    const ownershipError = await requireOwnership(
      existing.created_by, user.id, workspace.id,
    );
    if (ownershipError) return ownershipError;

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    updates.updated_by = user.id;

    const { data, error } = await supabaseAdmin
      .from("notes")
      .update(updates)
      .eq("id", noteId)
      .eq("workspace_id", workspace.id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ detail: error.message }, { status: 400 });
    if (!data) return notFound("Note");

    await insertAuditLog({
      userId: user.id,
      action: "UPDATE_NOTE",
      entityType: "Note",
      entityId: noteId,
      details: { changes: Object.keys(updates).filter((k) => k !== "updated_by") },
    });

    return NextResponse.json(data);
  } catch {
    return unauthorized();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { user, workspace } = await getRouteContext();
    const { noteId } = await params;

    const { data: existing } = await supabaseAdmin
      .from("notes")
      .select("created_by")
      .eq("id", noteId)
      .eq("workspace_id", workspace.id)
      .single();

    if (!existing) return notFound("Note");

    const ownershipError = await requireOwnership(
      existing.created_by, user.id, workspace.id,
    );
    if (ownershipError) return ownershipError;

    await insertAuditLog({
      userId: user.id,
      action: "DELETE_NOTE",
      entityType: "Note",
      entityId: noteId,
    });

    await supabaseAdmin
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("workspace_id", workspace.id);

    return new NextResponse(null, { status: 204 });
  } catch {
    return unauthorized();
  }
}
