"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useHistoryStore } from "@/stores/history-store";
import { useUIStore } from "@/stores/ui-store";

/**
 * Registers global keyboard shortcuts.
 * Extend the switch as new shortcuts land in later phases.
 */
export function useKeyboardShortcuts() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const setQuickCreateOpen = useUIStore((s) => s.setQuickCreateOpen);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      // Ctrl/Cmd+K — command palette (allowed even while typing)
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Undo / redo (allowed even while typing so forms keep native behaviour
      // only when there is nothing on the app history stack)
      if (mod && event.key.toLowerCase() === "z") {
        const history = useHistoryStore.getState();
        if (event.shiftKey) {
          if (history.redoStack.length > 0) {
            event.preventDefault();
            const entry = history.redo();
            if (entry) toast(`Redid: ${entry.label}`);
          }
        } else if (!isTyping && history.undoStack.length > 0) {
          event.preventDefault();
          const entry = history.undo();
          if (entry) toast(`Undid: ${entry.label}`);
        }
        return;
      }

      if (isTyping) return;

      // "c" — quick create task
      if (event.key.toLowerCase() === "c" && !mod) {
        event.preventDefault();
        setQuickCreateOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCommandPalette, setQuickCreateOpen]);
}
