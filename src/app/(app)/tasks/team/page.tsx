import type { Metadata } from "next";
import { TeamTasksView } from "@/features/tasks/components/team-tasks-view";

export const metadata: Metadata = { title: "Team Tasks" };

export default function TeamTasksPage() {
  return <TeamTasksView />;
}
