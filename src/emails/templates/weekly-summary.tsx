import { Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface WeeklySummaryEmailProps {
  userName: string;
  completedTasks: number;
  pendingTasks: number;
  hoursWorked: number;
  projectProgress: { name: string; progress: number }[];
  githubActivity: string[];
}

export function WeeklySummaryEmail({
  userName,
  completedTasks,
  pendingTasks,
  hoursWorked,
  projectProgress,
  githubActivity,
}: WeeklySummaryEmailProps) {
  return (
    <BaseEmail
      previewText="Your weekly summary from Orbit"
      heading="Weekly Summary"
    >
      <Text>Hi {userName},</Text>
      <Text>Here is your weekly performance overview.</Text>

      <Section className="my-4 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
          <Text className="m-0 text-2xl font-bold text-white">
            {completedTasks}
          </Text>
          <Text className="m-0 text-xs text-zinc-400">Completed</Text>
        </div>
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
          <Text className="m-0 text-2xl font-bold text-white">
            {pendingTasks}
          </Text>
          <Text className="m-0 text-xs text-zinc-400">Pending</Text>
        </div>
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
          <Text className="m-0 text-2xl font-bold text-white">
            {hoursWorked}h
          </Text>
          <Text className="m-0 text-xs text-zinc-400">Hours</Text>
        </div>
      </Section>

      {projectProgress.length > 0 && (
        <Section className="my-4">
          <Text className="text-sm font-semibold text-white">
            Project Progress
          </Text>
          {projectProgress.map((p, i) => (
            <Text key={i} className="m-0 py-1 text-sm text-zinc-300">
              • {p.name}: {p.progress}%
            </Text>
          ))}
        </Section>
      )}

      {githubActivity.length > 0 && (
        <Section className="my-4">
          <Text className="text-sm font-semibold text-white">
            GitHub Activity
          </Text>
          {githubActivity.map((a, i) => (
            <Text key={i} className="m-0 py-1 text-sm text-zinc-300">
              • {a}
            </Text>
          ))}
        </Section>
      )}
    </BaseEmail>
  );
}
