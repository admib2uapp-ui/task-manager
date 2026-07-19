import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getRouteContext,
  unauthorized,
  requireRole,
  getUserWorkspaceRole,
} from "@/lib/supabase/route-handler";

function toCamelCase(p: Record<string, unknown>) {
  return {
    id: p.id,
    workspaceId: p.workspace_id,
    name: p.name,
    description: p.description,
    color: p.color,
    icon: p.icon,
    status: p.status,
    deadline: p.deadline,
    repositoryUrl: p.repository_url,
    isFavorite: p.is_favorite,
    isArchived: p.is_archived,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    tags: ((p.tags as Array<Record<string, unknown>>) || []).map(
      (t: Record<string, unknown>) => t.tag as Record<string, unknown>,
    ),
  };
}

export async function GET(request: Request) {
  try {
    const { user, workspace } = await getRouteContext();
    const { searchParams } = new URL(request.url);

    const role = await getUserWorkspaceRole(user.id, workspace.id);

    let query = supabaseAdmin
      .from("projects")
      .select(
        `
        *,
        tags:project_tags(tag:tags(*))
      `,
      )
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (role === "general") {
      const { data: memberProjectIds } = await supabaseAdmin
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      const ids = (memberProjectIds || []).map((m) => m.project_id);
      query = query.in("id", ids.length > 0 ? ids : []);
    }

    const includeArchived = searchParams.get("includeArchived");
    if (includeArchived !== "true") {
      query = query.eq("is_archived", false);
    }

    const status = searchParams.get("status");
    if (status) query = query.eq("status", status);

    const favorite = searchParams.get("favorite");
    if (favorite === "true") query = query.eq("is_favorite", true);

    const search = searchParams.get("search");
    if (search) query = query.ilike("name", `%${search}%`);

    const { data } = await query;
    const projects = (data || []).map(toCamelCase);

    return NextResponse.json(projects);
  } catch {
    return unauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const { user, workspace } = await getRouteContext();

    const roleError = await requireRole(["owner"], user.id, workspace);
    if (roleError) return roleError;

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        workspace_id: workspace.id,
        name: body.name,
        description: body.description || null,
        color: body.color || "#3b82f6",
        icon: body.icon || "Folder",
        status: body.status || "active",
        deadline: body.deadline || null,
        is_favorite: body.isFavorite || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    await supabaseAdmin.from("project_members").insert({
      project_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    if (body.tagIds?.length > 0) {
      await supabaseAdmin.from("project_tags").insert(
        body.tagIds.map((tagId: string) => ({
          project_id: data.id,
          tag_id: tagId,
        })),
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return unauthorized();
  }
}
