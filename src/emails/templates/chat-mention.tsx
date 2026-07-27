import { Button, Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface ChatMentionEmailProps {
  userName: string;
  authorName: string;
  projectName: string;
  messageBody: string;
  chatUrl: string;
}

export function ChatMentionEmail({
  userName,
  authorName,
  projectName,
  messageBody,
  chatUrl,
}: ChatMentionEmailProps) {
  return (
    <BaseEmail
      previewText={`${authorName} mentioned you in ${projectName}`}
      heading="You Were Mentioned"
    >
      <Text>Hi {userName},</Text>
      <Text>
        <strong>{authorName}</strong> mentioned you in{" "}
        <strong>{projectName}</strong> chat.
      </Text>

      <Section className="my-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
        <Text className="m-0 text-sm italic text-zinc-300">
          &ldquo;{messageBody}&rdquo;
        </Text>
      </Section>

      <Section className="my-6 text-center">
        <Button
          href={chatUrl}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 no-underline"
        >
          Open Chat
        </Button>
      </Section>
    </BaseEmail>
  );
}
