"use client";

import { Bell, Menu, Plus, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-xl sm:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-xl md:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Search / command palette trigger */}
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className={cn(
          "group border-border bg-card/60 text-muted-foreground hover:border-border hover:bg-card flex h-9 flex-1 items-center gap-2 rounded-xl border px-3 text-sm transition-colors sm:max-w-80",
        )}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="border-border bg-muted text-muted-foreground pointer-events-none hidden items-center gap-1 rounded-md border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <div className="flex flex-1 items-center justify-end gap-1.5">
        <Button
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden h-9 gap-1.5 rounded-xl sm:inline-flex"
        >
          <Plus className="size-4" />
          Create
        </Button>
        <Button
          size="icon"
          onClick={() => setCommandPaletteOpen(true)}
          className="size-9 rounded-xl sm:hidden"
          aria-label="Create"
        >
          <Plus className="size-4" />
        </Button>

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative size-9 rounded-xl"
        >
          <Link href="/notifications" aria-label="Notifications">
            <Bell className="size-[18px]" />
            <span className="bg-primary absolute top-2 right-2 size-1.5 rounded-full" />
          </Link>
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}
