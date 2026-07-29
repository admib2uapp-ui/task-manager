import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionDefinition, ActionParams, ActionResult } from "./types";

async function handler(
  params: ActionParams,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const { workspaceId, userId } = params;
  const name = String(data.name ?? "").trim();

  if (!name) {
    return {
      success: false,
      actionType: "CREATE_PROJECT",
      entityType: "Project",
      error: "Project name is required",
    };
  }

  const { data: project, error } = await supabaseAdmin
    .from("projects")
    .insert({
      workspace_id: workspaceId,
      name,
      description: (data.description as string) || null,
      color: (data.color as string) || "#3b82f6",
      icon: (data.icon as string) || "Folder",
      status: (data.status as string) || "active",
      deadline: (data.deadline as string) || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      actionType: "CREATE_PROJECT",
      entityType: "Project",
      error: error.message,
    };
  }

  await supabaseAdmin.from("project_members").insert({
    project_id: project.id,
    user_id: userId,
    role: "owner",
  });

  if (Array.isArray(data.memberIds)) {
    const memberInserts = (data.memberIds as string[]).map(
      (memberId: string) => ({
        project_id: project.id,
        user_id: memberId,
        role: "general",
      }),
    );
    if (memberInserts.length > 0) {
      await supabaseAdmin.from("project_members").insert(memberInserts);
    }
  }

  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action: "AI_CREATE_PROJECT",
    entity_type: "Project",
    entity_id: project.id,
    details: { ai_generated: true, name },
  });

  return {
    success: true,
    actionType: "CREATE_PROJECT",
    entityType: "Project",
    entityId: project.id,
    details: { name: project.name },
  };
}

export const createProjectAction: ActionDefinition = {
  type: "CREATE_PROJECT",
  dangerLevel: "safe",
  minRole: "owner",
  handler,
};
