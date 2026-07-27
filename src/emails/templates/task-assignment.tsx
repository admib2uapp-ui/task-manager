import { Button, Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface TaskAssignmentEmailProps {
  userName: string;
  taskTitle: string;
  projectName: string;
  priority: string;
  deadline: string | null;
  assignedBy: string;
  taskUrl: string;
}

export function TaskAssignmentEmail({
  userName,
  taskTitle,
  projectName,
  priority,
  deadline,
  assignedBy,
  taskUrl,
}: TaskAssignmentEmailProps) {
  return (
    <BaseEmail
      previewText={`${assignedBy} assigned you to "${taskTitle}"`}
      heading="Task Assigned to You"
    >
      <Text>Hi {userName},</Text>
      <Text>
        <strong>{assignedBy}</strong> has assigned you to a task in{" "}
        <strong>{projectName}</strong>.
      </Text>

      <Section className="my-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
        <Text className="m-0 text-lg font-semibold text-white">
          {taskTitle}
        </Text>
        <div className="mt-2 flex gap-4 text-sm text-zinc-400">
          <span>Priority: {priority}</span>
          {deadline && <span>Deadline: {deadline}</span>}
        </div>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={taskUrl}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 no-underline"
        >
          Open Task
        </Button>
      </Section>

      <Text className="text-zinc-500 text-sm">
        Project: {projectName} &middot; Assigned by: {assignedBy}
      </Text>
    </BaseEmail>
  );
}
