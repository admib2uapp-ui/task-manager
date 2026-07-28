import type { ActionDefinition, ActionParams, ActionResult, ActionType } from "./types";
import { createProjectAction } from "./create-project-action";
import { createTaskAction } from "./create-task-action";
import { updateTaskAction } from "./update-task-action";
import { assignMemberAction } from "./assign-member-action";
import { createMilestoneAction } from "./create-milestone-action";
import { deleteTaskAction } from "./delete-task-action";

const actionRegistry: Map<ActionType, ActionDefinition> = new Map();

function register(action: ActionDefinition) {
  actionRegistry.set(action.type, action);
}

register(createProjectAction);
register(createTaskAction);
register(updateTaskAction);
register(assignMemberAction);
register(createMilestoneAction);
register(deleteTaskAction);

export function getAction(type: string): ActionDefinition | undefined {
  return actionRegistry.get(type as ActionType);
}

export function getAllActions(): ActionDefinition[] {
  return Array.from(actionRegistry.values());
}

export async function executeAction(
  type: string,
  actionParams: ActionParams,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const action = getAction(type);
  if (!action) {
    return {
      success: false,
      actionType: type,
      entityType: "Unknown",
      error: `Unknown action type: ${type}`,
    };
  }

  const roleHierarchy: Record<string, number> = {
    owner: 4,
    senior: 3,
    general: 2,
    junior: 1,
  };

  const userLevel = roleHierarchy[actionParams.userRole] ?? 0;
  const requiredLevel = roleHierarchy[action.minRole] ?? 0;

  if (userLevel < requiredLevel) {
    return {
      success: false,
      actionType: type,
      entityType: "Permission",
      error: `Insufficient permissions. Required: ${action.minRole}, you have: ${actionParams.userRole}`,
    };
  }

  return action.handler(actionParams, data);
}

export function isDangerousAction(type: string): boolean {
  const action = getAction(type);
  return action?.dangerLevel === "confirm";
}
