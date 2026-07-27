import { Button, Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface DeadlineReminderEmailProps {
  userName: string;
  taskTitle: string;
  projectName: string;
  timeRemaining: string;
  deadline: string;
  taskUrl: string;
}

export function DeadlineReminderEmail({
  userName,
  taskTitle,
  projectName,
  timeRemaining,
  deadline,
  taskUrl,
}: DeadlineReminderEmailProps) {
  return (
    <BaseEmail
      previewText={`"${taskTitle}" is due ${timeRemaining}`}
      heading="Deadline Approaching"
    >
      <Text>Hi {userName},</Text>
      <Text>
        The deadline for task <strong>&ldquo;{taskTitle}&rdquo;</strong> in{" "}
        <strong>{projectName}</strong> is {timeRemaining}.
      </Text>

      <Section className="my-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
        <Text className="m-0 text-lg font-semibold text-white">
          {taskTitle}
        </Text>
        <Text className="m-0 mt-1 text-sm text-amber-400">
          Due: {deadline} ({timeRemaining})
        </Text>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={taskUrl}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 no-underline"
        >
          View Task
        </Button>
      </Section>
    </BaseEmail>
  );
}
