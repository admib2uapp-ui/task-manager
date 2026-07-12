import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your profile, workspace and preferences."
      />
      <EmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Profile, appearance, notifications and data import/export will live here."
      />
    </PageContainer>
  );
}
