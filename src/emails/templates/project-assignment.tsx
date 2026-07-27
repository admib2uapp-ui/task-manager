import { Button, Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface ProjectAssignmentEmailProps {
  userName: string;
  projectName: string;
  projectDescription: string | null;
  role: string;
  assignedBy: string;
  assignmentDate: string;
  projectUrl: string;
}

export function ProjectAssignmentEmail({
  userName,
  projectName,
  projectDescription,
  role,
  assignedBy,
  assignmentDate,
  projectUrl,
}: ProjectAssignmentEmailProps) {
  return (
    <BaseEmail
      previewText={`${assignedBy} added you to ${projectName}`}
      heading="Project Assignment"
    >
      <Text>Hi {userName},</Text>
      <Text>
        <strong>{assignedBy}</strong> has added you to the project{" "}
        <strong>{projectName}</strong> with the role{" "}
        <strong>{role}</strong>.
      </Text>

      {projectDescription && (
        <Section className="my-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <Text className="m-0 text-sm text-zinc-300">
            {projectDescription}
          </Text>
        </Section>
      )}

      <Section className="my-4 text-sm text-zinc-400">
        <Text className="m-0">Role: {role}</Text>
        <Text className="m-0">Assigned by: {assignedBy}</Text>
        <Text className="m-0">Date: {assignmentDate}</Text>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={projectUrl}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 no-underline"
        >
          Open Project
        </Button>
      </Section>
    </BaseEmail>
  );
}
