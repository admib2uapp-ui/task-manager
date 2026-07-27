import { create } from "zustand";
import type { ChatMessage } from "@/types/domain";

interface ChatUIState {
  activeThread: ChatMessage | null;
  editingMessage: ChatMessage | null;
  replyingTo: ChatMessage | null;
  searchOpen: boolean;
  searchQuery: string;

  setActiveThread: (message: ChatMessage | null) => void;
  setEditingMessage: (message: ChatMessage | null) => void;
  setReplyingTo: (message: ChatMessage | null) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

export const useChatUIStore = create<ChatUIState>((set) => ({
  activeThread: null,
  editingMessage: null,
  replyingTo: null,
  searchOpen: false,
  searchQuery: "",

  setActiveThread: (message) => set({ activeThread: message }),
  setEditingMessage: (message) => set({ editingMessage: message }),
  setReplyingTo: (message) => set({ replyingTo: message }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  reset: () =>
    set({
      activeThread: null,
      editingMessage: null,
      replyingTo: null,
      searchOpen: false,
      searchQuery: "",
    }),
}));
