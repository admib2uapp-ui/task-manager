"use client";

import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/stores/ui-store";

export function MobileSidebar() {
  const open = useUIStore((s) => s.mobileSidebarOpen);
  const setOpen = useUIStore((s) => s.setMobileSidebarOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="border-sidebar-border bg-sidebar w-72 gap-0 p-0"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="border-sidebar-border flex h-16 items-center border-b px-4">
          <Logo />
        </div>
        <ScrollArea className="flex-1">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </ScrollArea>
        <div className="border-sidebar-border border-t p-2">
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
