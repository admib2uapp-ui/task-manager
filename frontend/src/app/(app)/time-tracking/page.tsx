import type { Metadata } from "next";
import { TimeTrackingView } from "@/features/time/components/time-tracking-view";

export const metadata: Metadata = { title: "Time Tracking" };

export default function TimeTrackingPage() {
  return <TimeTrackingView />;
}
