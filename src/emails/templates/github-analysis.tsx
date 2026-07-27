import { Button, Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface GitHubAnalysisEmailProps {
  userName: string;
  repoName: string;
  analysisType: string;
  repoUrl: string;
}

export function GitHubAnalysisEmail({
  userName,
  repoName,
  analysisType,
  repoUrl,
}: GitHubAnalysisEmailProps) {
  return (
    <BaseEmail
      previewText={`${analysisType} for ${repoName}`}
      heading="GitHub Analysis Complete"
    >
      <Text>Hi {userName},</Text>
      <Text>
        The {analysisType} for <strong>{repoName}</strong> is complete.
      </Text>

      <Section className="my-6 text-center">
        <Button
          href={repoUrl}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 no-underline"
        >
          View Repository
        </Button>
      </Section>
    </BaseEmail>
  );
}
