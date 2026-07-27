import { Text } from "@react-email/components";
import { BaseEmail } from "../layouts/base-email";

interface SecurityAlertEmailProps {
  userName: string;
  alertType: string;
  details: string;
  actionUrl: string;
}

export function SecurityAlertEmail({
  userName,
  alertType,
  details,
}: SecurityAlertEmailProps) {
  return (
    <BaseEmail
      previewText={`Security alert: ${alertType}`}
      heading="Security Alert"
    >
      <Text>Hi {userName},</Text>
      <Text>{details}</Text>
      <Text className="text-zinc-500 text-sm">
        If you did not perform this action, please contact your workspace
        administrator immediately.
      </Text>
    </BaseEmail>
  );
}
