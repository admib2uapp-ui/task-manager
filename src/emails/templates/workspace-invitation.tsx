import { Button, Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface WorkspaceInvitationEmailProps {
  userName: string;
  workspaceName: string;
  invitedBy: string;
  workspaceUrl: string;
}

export function WorkspaceInvitationEmail({
  userName,
  workspaceName,
  invitedBy,
  workspaceUrl,
}: WorkspaceInvitationEmailProps) {
  return (
    <BaseEmail
      previewText={`${invitedBy} invited you to ${workspaceName}`}
      heading="Workspace Invitation"
    >
      <Text>Hi {userName},</Text>
      <Text>
        <strong>{invitedBy}</strong> has invited you to join{" "}
        <strong>{workspaceName}</strong>.
      </Text>

      <Section className="my-6 text-center">
        <Button
          href={workspaceUrl}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 no-underline"
        >
          Join Workspace
        </Button>
      </Section>
    </BaseEmail>
  );
}
