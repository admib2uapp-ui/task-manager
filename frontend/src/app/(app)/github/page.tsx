import type { Metadata } from "next";
import { GitHubView } from "@/features/github/components/github-view";

export const metadata: Metadata = { title: "GitHub" };

export default function GitHubPage() {
  return <GitHubView />;
}
