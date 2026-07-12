"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CommandPalette } from "@/features/command-palette/components/command-palette";
import { QuickTaskDialog } from "@/features/tasks/components/quick-task-dialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useUIStore } from "@/stores/ui-store";

export function AppShell({ children }: { children: ReactNode }) {
  useKeyboardShortcuts();
  const quickCreateOpen = useUIStore((s) => s.quickCreateOpen);
  const setQuickCreateOpen = useUIStore((s) => s.setQuickCreateOpen);

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <AppSidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 scrollbar-thin overflow-y-auto">
          {children}
        </main>
      </div>
      <CommandPalette />
      <QuickTaskDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
      />
    </div>
  );
}
