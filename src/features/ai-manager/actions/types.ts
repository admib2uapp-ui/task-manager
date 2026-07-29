export type ActionType =
  | "CREATE_PROJECT"
  | "UPDATE_PROJECT"
  | "DELETE_PROJECT"
  | "CREATE_TASK"
  | "UPDATE_TASK"
  | "DELETE_TASK"
  | "ASSIGN_MEMBER"
  | "REMOVE_MEMBER"
  | "CREATE_MILESTONE"
  | "DELETE_MILESTONE"
  | "SET_PRIORITY"
  | "SET_DEADLINE"
  | "ADD_SUBTASK"
  | "ADD_CHECKLIST"
  | "GENERATE_REPORT";

export type ActionDangerLevel = "safe" | "confirm";

export interface ActionParams {
  workspaceId: string;
  userId: string;
  userRole: string;
}

export interface ActionResult {
  success: boolean;
  actionType: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface ActionDefinition {
  type: ActionType;
  dangerLevel: ActionDangerLevel;
  minRole: "owner" | "senior" | "general" | "junior";
  handler: (params: ActionParams, actionData: Record<string, unknown>) => Promise<ActionResult>;
}
