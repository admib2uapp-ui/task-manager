import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface BaseEmailProps {
  previewText: string;
  heading: string;
  children: React.ReactNode;
}

export function BaseEmail({ previewText, heading, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-zinc-950 font-sans">
          <Container className="mx-auto max-w-[600px] px-4 py-8">
            <Section className="text-center">
              <Img
                src="https://kflvbedrgvmgkkajwbui.supabase.co/storage/v1/object/public/chat-attachments/orbit-logo.png"
                alt="Orbit"
                width="40"
                height="40"
                className="mx-auto mb-4"
              />
            </Section>

            <Section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
              <Heading className="m-0 mb-2 text-2xl font-bold text-white">
                {heading}
              </Heading>

              <div className="text-zinc-300 text-base leading-relaxed">
                {children}
              </div>

              <Hr className="my-6 border-zinc-800" />

              <Text className="m-0 text-center text-sm text-zinc-500">
                Orbit — Project Management Platform
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
