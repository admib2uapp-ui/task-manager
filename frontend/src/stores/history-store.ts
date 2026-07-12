import { create } from "zustand";

export interface HistoryEntry {
  label: string;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

interface HistoryState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  push: (entry: HistoryEntry) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  clear: () => void;
}

const MAX = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  push: (entry) =>
    set((s) => ({
      undoStack: [...s.undoStack, entry].slice(-MAX),
      redoStack: [],
    })),

  undo: () => {
    const { undoStack } = get();
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return null;
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, entry].slice(-MAX),
    }));
    void entry.undo();
    return entry;
  },

  redo: () => {
    const { redoStack } = get();
    const entry = redoStack[redoStack.length - 1];
    if (!entry) return null;
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, entry].slice(-MAX),
    }));
    void entry.redo();
    return entry;
  },

  clear: () => set({ undoStack: [], redoStack: [] }),
}));
