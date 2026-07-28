import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  /** desktop sidebar collapsed to icon rail */
  sidebarCollapsed: boolean;
  /** mobile off-canvas sidebar */
  mobileSidebarOpen: boolean;
  /** global command palette (Ctrl/Cmd+K) */
  commandPaletteOpen: boolean;
  /** quick create task/project modal */
  quickCreateOpen: boolean;
  /** globally-opened task detail (e.g. from command palette) */
  openTaskId: string | null;
  /** AI Manager floating widget */
  aiManagerOpen: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setQuickCreateOpen: (open: boolean) => void;
  setOpenTaskId: (id: string | null) => void;
  setAiManagerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      commandPaletteOpen: false,
      quickCreateOpen: false,
      openTaskId: null,
      aiManagerOpen: false,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setQuickCreateOpen: (open) => set({ quickCreateOpen: open }),
      setOpenTaskId: (id) => set({ openTaskId: id }),
      setAiManagerOpen: (open) => set({ aiManagerOpen: open }),
    }),
    {
      name: "orbit.ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
