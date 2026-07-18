import type { Metadata } from "next";
import { MyTasksView } from "@/features/tasks/components/my-tasks-view";

export const metadata: Metadata = { title: "My Tasks" };

export default function TasksPage() {
  return <MyTasksView />;
}
