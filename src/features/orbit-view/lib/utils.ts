import type { OrbitHubType, OrbitHubData, OrbitCard, IdeaPriority } from "@/features/orbit-view/types";
import { ORBIT_HUB_META, IDEA_PRIORITY_COLORS } from "@/features/orbit-view/types";
import type { Task } from "@/types/domain";

export function getHubColor(hub: OrbitHubType): string {
  return ORBIT_HUB_META[hub].color;
}

export function getHubLabel(hub: OrbitHubType): string {
  return ORBIT_HUB_META[hub].label;
}

export function getPriorityColor(priority: string): string {
  return IDEA_PRIORITY_COLORS[priority as IdeaPriority] ?? "#71717a";
}

export function computeHubProgress(cards: OrbitCard[]): number {
  if (cards.length === 0) return 0;
  const completed = cards.filter((c) => c.status === "done" || c.status === "completed" || c.status === "approved").length;
  return Math.round((completed / cards.length) * 100);
}

export function computeTaskProgress(task: Task): number {
  const subtasks = task.subtasks ?? [];
  if (subtasks.length === 0) {
    return task.status === "done" ? 100 : task.status === "in_progress" ? 50 : 0;
  }
  const done = subtasks.filter((s) => s.completed).length;
  return Math.round((done / subtasks.length) * 100);
}

export function createEmptyHubData(type: OrbitHubType): OrbitHubData {
  return {
    type,
    label: ORBIT_HUB_META[type].label,
    icon: ORBIT_HUB_META[type].icon,
    cards: [],
    progress: 0,
    color: ORBIT_HUB_META[type].color,
    count: 0,
  };
}

export function formatOrbitDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getRiskColor(score: number): string {
  if (score >= 8) return "#ef4444";
  if (score >= 5) return "#f59e0b";
  if (score >= 3) return "#3b82f6";
  return "#22c55e";
}

export function getRiskGlow(score: number): string {
  if (score >= 8) return "0 0 12px #ef4444, 0 0 24px #ef4444";
  if (score >= 5) return "0 0 8px #f59e0b, 0 0 16px #f59e0b";
  return "none";
}
