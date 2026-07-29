import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionDefinition, ActionParams, ActionResult } from "./types";

async function handler(
  params: ActionParams,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const { userId } = params;
  const taskId = String(data.taskId ?? "");

  if (!taskId) {
    return {
      success: false,
      actionType: "UPDATE_TASK",
      entityType: "Task",
      error: "Task ID is required",
    };
  }

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.assigneeId !== undefined) updates.assignee_id = data.assigneeId;
  if (data.deadline !== undefined) updates.deadline = data.deadline;
  if (data.estimatedHours !== undefined)
    updates.estimated_hours = data.estimatedHours;
  updates.updated_by = userId;

  if (Object.keys(updates).length === 0) {
    return {
      success: false,
      actionType: "UPDATE_TASK",
      entityType: "Task",
      error: "No fields to update",
    };
  }

  const { data: existing } = await supabaseAdmin
    .from("tasks")
    .select("project_id")
    .eq("id", taskId)
    .single();

  if (!existing) {
    return {
      success: false,
      actionType: "UPDATE_TASK",
      entityType: "Task",
      error: "Task not found",
    };
  }

  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      actionType: "UPDATE_TASK",
      entityType: "Task",
      error: error.message,
    };
  }

  if (data.assigneeId) {
    const { data: existingMember } = await supabaseAdmin
      .from("project_members")
      .select("id")
      .eq("project_id", task.project_id)
      .eq("user_id", data.assigneeId as string)
      .maybeSingle();

    if (!existingMember) {
      await supabaseAdmin.from("project_members").insert({
        project_id: task.project_id,
        user_id: data.assigneeId as string,
        role: "general",
      });
    }
  }

  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action: "AI_UPDATE_TASK",
    entity_type: "Task",
    entity_id: taskId,
    details: { ai_generated: true, changes: Object.keys(updates) },
  });

  return {
    success: true,
    actionType: "UPDATE_TASK",
    entityType: "Task",
    entityId: taskId,
    details: { changes: Object.keys(updates).filter((k) => k !== "updated_by") },
  };
}

export const updateTaskAction: ActionDefinition = {
  type: "UPDATE_TASK",
  dangerLevel: "safe",
  minRole: "owner",
  handler,
};
