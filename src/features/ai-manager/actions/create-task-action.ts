import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionDefinition, ActionParams, ActionResult } from "./types";

async function handler(
  params: ActionParams,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const { userId } = params;
  const projectId = String(data.projectId ?? "");
  const title = String(data.title ?? "").trim();

  if (!projectId || !title) {
    return {
      success: false,
      actionType: "CREATE_TASK",
      entityType: "Task",
      error: !title ? "Task title is required" : "Project ID is required",
    };
  }

  const { data: maxPos } = await supabaseAdmin
    .from("tasks")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPos = (maxPos?.[0]?.position ?? -1024) + 1024;

  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .insert({
      project_id: projectId,
      title,
      description: (data.description as string) || null,
      status: (data.status as string) || "backlog",
      priority: (data.priority as string) || "medium",
      position: nextPos,
      assignee_id: (data.assigneeId as string) || null,
      deadline: (data.deadline as string) || null,
      estimated_hours: (data.estimatedHours as number) || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      actionType: "CREATE_TASK",
      entityType: "Task",
      error: error.message,
    };
  }

  if (data.assigneeId) {
    const { data: existingMember } = await supabaseAdmin
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", data.assigneeId as string)
      .maybeSingle();

    if (!existingMember) {
      await supabaseAdmin.from("project_members").insert({
        project_id: projectId,
        user_id: data.assigneeId as string,
        role: "general",
      });
    }
  }

  if (Array.isArray(data.subtasks)) {
    const subtaskInserts = (data.subtasks as string[]).map(
      (subtaskTitle: string, idx: number) => ({
        task_id: task.id,
        title: subtaskTitle,
        position: idx * 1024,
      }),
    );
    if (subtaskInserts.length > 0) {
      await supabaseAdmin.from("subtasks").insert(subtaskInserts);
    }
  }

  if (Array.isArray(data.checklistItems)) {
    const checklistInserts = (data.checklistItems as string[]).map(
      (content: string, idx: number) => ({
        task_id: task.id,
        content,
        position: idx * 1024,
      }),
    );
    if (checklistInserts.length > 0) {
      await supabaseAdmin.from("checklist_items").insert(checklistInserts);
    }
  }

  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action: "AI_CREATE_TASK",
    entity_type: "Task",
    entity_id: task.id,
    details: { ai_generated: true, title, project_id: projectId },
  });

  return {
    success: true,
    actionType: "CREATE_TASK",
    entityType: "Task",
    entityId: task.id,
    details: { title: task.title, projectId },
  };
}

export const createTaskAction: ActionDefinition = {
  type: "CREATE_TASK",
  dangerLevel: "safe",
  minRole: "owner",
  handler,
};
