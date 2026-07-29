import { supabaseAdmin } from "@/lib/supabase/admin";

interface ProjectInfo {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
}

export interface AiContext {
  page: string;
  projects?: ProjectInfo[];
  project?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    deadline: string | null;
    taskCount: number;
    milestoneCount: number;
  };
  members: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    assigneeName: string | null;
    deadline: string | null;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    dueDate: string | null;
    completed: boolean;
  }>;
  conversationHistory?: Array<{
    role: string;
    content: string;
  }>;
}

export async function buildProjectContext(
  projectId: string,
  workspaceId: string,
): Promise<AiContext> {
  const [projectResult, membersResult, tasksResult, milestonesResult] =
    await Promise.all([
      supabaseAdmin
        .from("projects")
        .select("id, name, description, status, deadline")
        .eq("id", projectId)
        .eq("workspace_id", workspaceId)
        .single(),
      supabaseAdmin
        .from("project_members")
        .select("user_id, role, user:users(id, name)")
        .eq("project_id", projectId),
      supabaseAdmin
        .from("tasks")
        .select(
          "id, title, status, priority, deadline, assignee:users(name)",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("milestones")
        .select("id, name, due_date, completed")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const project = projectResult.data;
  const members = membersResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const milestones = milestonesResult.data ?? [];

  const { count: taskCount } = await supabaseAdmin
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { count: milestoneCount } = await supabaseAdmin
    .from("milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  return {
    page: "project",
    project: project
      ? {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          deadline: project.deadline,
          taskCount: taskCount ?? 0,
          milestoneCount: milestoneCount ?? 0,
        }
      : undefined,
    members: members.map((m: Record<string, unknown>) => ({
      id: m.user_id as string,
      name: (m.user as Record<string, unknown>)?.name as string ?? "Unknown",
      role: m.role as string,
    })),
    recentTasks: tasks.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      title: t.title as string,
      status: t.status as string,
      priority: t.priority as string,
      assigneeName: (t.assignee as Record<string, unknown>)?.name as string | null ?? null,
      deadline: t.deadline as string | null,
    })),
    milestones: milestones.map((m: Record<string, unknown>) => ({
      id: m.id as string,
      name: m.name as string,
      dueDate: m.due_date as string | null,
      completed: m.completed as boolean,
    })),
  };
}

export async function buildWorkspaceContext(
  workspaceId: string,
): Promise<AiContext> {
  const { data: memberData } = await supabaseAdmin
    .from("workspace_members")
    .select("user_id, role, user:users(id, name)")
    .eq("workspace_id", workspaceId);

  const members = memberData ?? [];

  const { data: projectsData } = await supabaseAdmin
    .from("projects")
    .select("id, name, status, deadline")
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const projects = projectsData ?? [];

  return {
    page: "workspace",
    projects: projects.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      status: p.status as string,
      deadline: p.deadline as string | null,
    })),
    members: members.map((m: Record<string, unknown>) => ({
      id: m.user_id as string,
      name: (m.user as Record<string, unknown>)?.name as string ?? "Unknown",
      role: m.role as string,
    })),
    recentTasks: [],
    milestones: [],
    project: undefined,
  };
}
