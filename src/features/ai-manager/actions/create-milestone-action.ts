import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionDefinition, ActionParams, ActionResult } from "./types";

async function handler(
  params: ActionParams,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const { userId } = params;
  const projectId = String(data.projectId ?? "");
  const name = String(data.name ?? "").trim();

  if (!projectId || !name) {
    return {
      success: false,
      actionType: "CREATE_MILESTONE",
      entityType: "Milestone",
      error: !name ? "Milestone name is required" : "Project ID is required",
    };
  }

  const { data: maxPos } = await supabaseAdmin
    .from("milestones")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPos = (maxPos?.[0]?.position ?? 0) + 1024;

  const { data: milestone, error } = await supabaseAdmin
    .from("milestones")
    .insert({
      project_id: projectId,
      name,
      description: (data.description as string) || null,
      due_date: (data.dueDate as string) || null,
      position: nextPos,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      actionType: "CREATE_MILESTONE",
      entityType: "Milestone",
      error: error.message,
    };
  }

  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action: "AI_CREATE_MILESTONE",
    entity_type: "Milestone",
    entity_id: milestone.id,
    details: { ai_generated: true, name, project_id: projectId },
  });

  return {
    success: true,
    actionType: "CREATE_MILESTONE",
    entityType: "Milestone",
    entityId: milestone.id,
    details: { name: milestone.name, projectId },
  };
}

export const createMilestoneAction: ActionDefinition = {
  type: "CREATE_MILESTONE",
  dangerLevel: "safe",
  minRole: "owner",
  handler,
};
