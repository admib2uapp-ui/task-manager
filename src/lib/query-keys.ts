/**
 * Centralised TanStack Query keys.
 * Keeping them in one place makes cache invalidation predictable across features.
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  workspaces: {
    all: ["workspaces"] as const,
  },
  tags: {
    all: ["tags"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (filters?: unknown) => ["projects", "list", filters ?? {}] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (filters?: unknown) => ["tasks", "list", filters ?? {}] as const,
    board: (projectId: string) => ["tasks", "board", projectId] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: unknown) => ["notifications", "list", filters ?? {}] as const,
    unread: ["notifications", "unread"] as const,
    history: (filters?: unknown) => ["notifications", "history", filters ?? {}] as const,
    preferences: ["notifications", "preferences"] as const,
  },
} as const;
