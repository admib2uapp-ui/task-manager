import type { Metadata } from "next";
import { RepositoryList } from "@/features/repositories/components/repository-list";

export const metadata: Metadata = { title: "Repositories" };

export default function RepositoriesPage() {
  return <RepositoryList />;
}
