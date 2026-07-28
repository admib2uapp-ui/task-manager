import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionDefinition, ActionParams, ActionResult } from "./types";

async function handler(
  params: ActionParams,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const { userId } = params;
  const taskId = String(data.taskId ?? "");
  const assigneeUserId = String(data.userId ?? "");
  const projectId = String(data.projectId ?? "");

  if (taskId && assigneeUserId) {
    const { data: existing } = await supabaseAdmin
      .from("tasks")
      .select("id, project_id")
      .eq("id", taskId)
      .single();

    if (!existing) {
      return {
        success: false,
        actionType: "ASSIGN_MEMBER",
        entityType: "Task",
        error: "Task not found",
      };
    }

    const { error } = await supabaseAdmin
      .from("tasks")
      .update({ assignee_id: assigneeUserId, updated_by: userId })
      .eq("id", taskId);

    if (error) {
      return {
        success: false,
        actionType: "ASSIGN_MEMBER",
        entityType: "Task",
        error: error.message,
      };
    }

    await ensureProjectMember(existing.project_id, assigneeUserId);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "AI_ASSIGN_TASK",
      entity_type: "Task",
      entity_id: taskId,
      details: { ai_generated: true, assignee_id: assigneeUserId },
    });

    return {
      success: true,
      actionType: "ASSIGN_MEMBER",
      entityType: "Task",
      entityId: taskId,
      details: { taskId, userId: assigneeUserId },
    };
  }

  if (projectId && assigneeUserId) {
    await ensureProjectMember(projectId, assigneeUserId);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "AI_ADD_PROJECT_MEMBER",
      entity_type: "Project",
      entity_id: projectId,
      details: { ai_generated: true, user_id: assigneeUserId },
    });

    return {
      success: true,
      actionType: "ASSIGN_MEMBER",
      entityType: "ProjectMember",
      details: { projectId, userId: assigneeUserId },
    };
  }

  return {
    success: false,
    actionType: "ASSIGN_MEMBER",
    entityType: "Task",
    error: "Either taskId+userId or projectId+userId required",
  };
}

async function ensureProjectMember(projectId: string, targetUserId: string) {
  const { data: existing } = await supabaseAdmin
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!existing) {
    await supabaseAdmin.from("project_members").insert({
      project_id: projectId,
      user_id: targetUserId,
      role: "general",
    });
  }
}

export const assignMemberAction: ActionDefinition = {
  type: "ASSIGN_MEMBER",
  dangerLevel: "safe",
  minRole: "owner",
  handler,
};
