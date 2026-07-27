import { Button, Section, Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface AIReportEmailProps {
  userName: string;
  reportName: string;
  projectName: string;
  reportUrl: string;
}

export function AIReportEmail({
  userName,
  reportName,
  projectName,
  reportUrl,
}: AIReportEmailProps) {
  return (
    <BaseEmail
      previewText={`${reportName} is ready`}
      heading="AI Report Ready"
    >
      <Text>Hi {userName},</Text>
      <Text>
        Your AI report <strong>&ldquo;{reportName}&rdquo;</strong> for{" "}
        <strong>{projectName}</strong> is ready to review.
      </Text>

      <Section className="my-6 text-center">
        <Button
          href={reportUrl}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 no-underline"
        >
          View Report
        </Button>
      </Section>
    </BaseEmail>
  );
}
