import { Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface DailyDigestEmailProps {
  userName: string;
  todayTasks: { title: string; project: string; priority: string }[];
  upcomingDeadlines: { title: string; deadline: string }[];
  overdueTasks: { title: string; deadline: string }[];
}

export function DailyDigestEmail({
  userName,
  todayTasks,
  upcomingDeadlines,
  overdueTasks,
}: DailyDigestEmailProps) {
  return (
    <BaseEmail
      previewText="Your daily digest from Orbit"
      heading="Daily Digest"
    >
      <Text>Hi {userName},</Text>
      <Text>Here is your daily overview.</Text>

      {todayTasks.length > 0 && (
        <Section className="my-4">
          <Text className="text-sm font-semibold text-white">
            Today&apos;s Tasks ({todayTasks.length})
          </Text>
          {todayTasks.map((task, i) => (
            <Text key={i} className="m-0 py-1 text-sm text-zinc-300">
              • {task.title} ({task.project})
            </Text>
          ))}
        </Section>
      )}

      {upcomingDeadlines.length > 0 && (
        <Section className="my-4">
          <Text className="text-sm font-semibold text-amber-400">
            Upcoming Deadlines
          </Text>
          {upcomingDeadlines.map((d, i) => (
            <Text key={i} className="m-0 py-1 text-sm text-zinc-300">
              • {d.title} — {d.deadline}
            </Text>
          ))}
        </Section>
      )}

      {overdueTasks.length > 0 && (
        <Section className="my-4">
          <Text className="text-sm font-semibold text-red-400">
            Overdue Tasks
          </Text>
          {overdueTasks.map((t, i) => (
            <Text key={i} className="m-0 py-1 text-sm text-zinc-300">
              • {t.title} (was due {t.deadline})
            </Text>
          ))}
        </Section>
      )}
    </BaseEmail>
  );
}
