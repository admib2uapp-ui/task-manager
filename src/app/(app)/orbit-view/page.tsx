"use client";

import dynamic from "next/dynamic";
import { FullScreenLoader } from "@/components/shared/full-screen-loader";

const OrbitWorkspace = dynamic(
  () =>
    import("@/features/orbit-view/components/orbit-workspace").then(
      (m) => m.OrbitWorkspace,
    ),
  {
    ssr: false,
    loading: () => <FullScreenLoader />,
  },
);

export default function OrbitViewPage() {
  return <OrbitWorkspace />;
}
