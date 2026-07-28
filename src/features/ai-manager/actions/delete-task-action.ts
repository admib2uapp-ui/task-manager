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
      actionType: "DELETE_TASK",
      entityType: "Task",
      error: "Task ID is required",
    };
  }

  const { data: existing } = await supabaseAdmin
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .single();

  if (!existing) {
    return {
      success: false,
      actionType: "DELETE_TASK",
      entityType: "Task",
      error: "Task not found",
    };
  }

  await supabaseAdmin.from("subtasks").delete().eq("task_id", taskId);
  await supabaseAdmin.from("checklist_items").delete().eq("task_id", taskId);
  await supabaseAdmin.from("comments").delete().eq("task_id", taskId);
  await supabaseAdmin.from("task_tags").delete().eq("task_id", taskId);
  await supabaseAdmin.from("task_dependencies").delete().eq("task_id", taskId);
  await supabaseAdmin.from("tasks").delete().eq("id", taskId);

  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action: "AI_DELETE_TASK",
    entity_type: "Task",
    entity_id: taskId,
    details: { ai_generated: true, title: existing.title },
  });

  return {
    success: true,
    actionType: "DELETE_TASK",
    entityType: "Task",
    entityId: taskId,
    details: { title: existing.title },
  };
}

export const deleteTaskAction: ActionDefinition = {
  type: "DELETE_TASK",
  dangerLevel: "confirm",
  minRole: "owner",
  handler,
};
