import type { Metadata } from "next";
import { Suspense } from "react";
import { GitHubView } from "@/features/github/components/github-view";

export const metadata: Metadata = { title: "GitHub" };

export default function GitHubPage() {
  return (
    <Suspense>
      <GitHubView />
    </Suspense>
  );
}
