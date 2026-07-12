"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { flatNavigation } from "@/config/navigation";
import { useUIStore } from "@/stores/ui-store";

/**
 * Global command palette (Ctrl/Cmd+K).
 * Phase 0 ships navigation + quick actions; search results are wired in
 * later phases via the search feature.
 */
export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setQuickCreateOpen = useUIStore((s) => s.setQuickCreateOpen);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search and run commands"
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            value="new task create quick add"
            onSelect={() => run(() => setQuickCreateOpen(true))}
          >
            <Plus className="size-4" />
            Create task
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {flatNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={`go ${item.title}`}
                onSelect={() => run(() => router.push(item.href))}
              >
                <Icon className="size-4" />
                {item.title}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
