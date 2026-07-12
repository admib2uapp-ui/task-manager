"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "border-sidebar-border bg-sidebar hidden shrink-0 flex-col border-r transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "border-sidebar-border flex h-16 items-center border-b px-4",
          collapsed ? "justify-center px-0" : "justify-between",
        )}
      >
        <Logo iconOnly={collapsed} />
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground size-8 rounded-lg"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-[18px]" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <SidebarNav collapsed={collapsed} />
      </ScrollArea>

      {collapsed && (
        <div className="border-sidebar-border flex justify-center border-t py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground size-8 rounded-lg"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-[18px]" />
          </Button>
        </div>
      )}

      <div className="border-sidebar-border border-t p-2">
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
