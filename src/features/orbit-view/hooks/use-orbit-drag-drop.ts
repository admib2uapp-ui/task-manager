"use client";

import { useCallback, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/features/tasks/api/tasks-api";
import { orbitIdeasApi, orbitLinksApi } from "@/features/orbit-view/api/orbit-api";
import { queryKeys } from "@/lib/query-keys";
import type { OrbitHubType, OrbitCard } from "@/features/orbit-view/types";
import type { TaskStatus, TaskPriority } from "@/types/domain";

const HUB_TO_STATUS: Partial<Record<OrbitHubType, TaskStatus>> = {
  development: "in_progress",
  testing: "in_progress",
  review: "review",
  completed: "done",
};

const HUB_TO_TAG: Partial<Record<OrbitHubType, string>> = {
  testing: "Testing",
};

interface UseOrbitDragDropOptions {
  projectId?: string;
  onCardMoved?: () => void;
}

export function useOrbitDragDrop({ projectId, onCardMoved }: UseOrbitDragDropOptions) {
  const [activeCard, setActiveCard] = useState<OrbitCard | null>(null);
  const queryClient = useQueryClient();
  const pendingMoveRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = event.active.data.current?.card as OrbitCard | undefined;
    if (card) setActiveCard(card);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over) return;

      const card = active.data.current?.card as OrbitCard | undefined;
      const targetHub = over.data.current?.hubType as OrbitHubType | undefined;

      if (!card || !targetHub || card.hubType === targetHub) return;

      // Idea → Development: create task from idea
      if (card.hubType === "ideas" && targetHub === "development" && card.idea && projectId) {
        try {
          const task = await tasksApi.create({
            projectId,
            title: card.title,
            description: card.description,
            status: "in_progress",
            priority: card.priority as TaskPriority,
          });

          await orbitLinksApi.linkIdeaToTask(card.idea.id, task.id);
          await orbitIdeasApi.update(card.idea.id, { status: "approved" as const } as Record<string, unknown>);

          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.hub(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.ideas(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.board(projectId) });

          toast.success("Idea moved to Development", {
            description: `Created task "${card.title}"`,
          });
          onCardMoved?.();
          return;
        } catch {
          toast.error("Failed to move idea to development");
          return;
        }
      }

      // Task-based hub transitions
      if (card.task?.id && projectId) {
        const newStatus = HUB_TO_STATUS[targetHub];
        if (!newStatus) return;

        try {
          pendingMoveRef.current = true;
          await tasksApi.move(card.task.id, {
            status: newStatus,
            position: 4096,
          });

          // Apply tag for testing
          const tag = HUB_TO_TAG[targetHub];
          if (tag && card.task.tags) {
            await tasksApi.update(card.task.id, { tagIds: [...(card.task.tags.map((t) => t.id) ?? [])] });
          }

          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.hub(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.board(projectId) });

          toast.success(`Moved to ${targetHub}`, {
            description: `"${card.title}" moved to ${targetHub}`,
          });
          onCardMoved?.();
        } catch {
          toast.error("Failed to move card");
        }
      }
    },
    [projectId, queryClient, onCardMoved],
  );

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
  }, []);

  return {
    sensors,
    activeCard,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    DndContextWrapper: DndContext,
    DragOverlayComponent: DragOverlay,
  };
}
