import { CalendarClock, CheckCircle2, FolderKanban, Timer } from "lucide-react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Your workspace at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Tasks"
          value={0}
          icon={CheckCircle2}
          accent="#3b82f6"
          hint="Nothing due today"
        />
        <StatCard
          label="Active Projects"
          value={0}
          icon={FolderKanban}
          accent="#22c55e"
          hint="Create your first project"
        />
        <StatCard
          label="Upcoming Deadlines"
          value={0}
          icon={CalendarClock}
          accent="#f59e0b"
          hint="Next 7 days"
        />
        <StatCard
          label="Tracked Today"
          value="0h 0m"
          icon={Timer}
          accent="#a855f7"
          hint="Start a timer to track"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border bg-card shadow-soft rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recently Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={FolderKanban}
              title="No recent activity"
              description="Projects and tasks you work on will appear here."
              className="border-0 bg-transparent py-10"
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-soft rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Tasks Today</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CheckCircle2}
              title="All clear"
              description="You have no tasks scheduled for today."
              className="border-0 bg-transparent py-10"
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
