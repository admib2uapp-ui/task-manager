import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { RepositoryDetailView } from "@/features/repositories/components/repository-detail-view";

export const metadata: Metadata = { title: "Repository" };

export default async function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageContainer>
      <RepositoryDetailView connectionId={id} />
    </PageContainer>
  );
}
