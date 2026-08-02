"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { tasksApi } from "@/features/tasks/api/tasks-api";
import { orbitIdeasApi } from "@/features/orbit-view/api/orbit-api";
import type { OrbitHubData, OrbitCard, OrbitHubType } from "@/features/orbit-view/types";
import { createEmptyHubData, computeHubProgress } from "@/features/orbit-view/lib/utils";
import type { Task } from "@/types/domain";

function taskToOrbitCard(task: Task, hubType: OrbitHubType): OrbitCard {
  return {
    id: task.id,
    hubType,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    assignees: task.assignee ? [task.assignee] : [],
    tags: task.tags?.map((t) => t.name) ?? [],
    commentCount: task.comments?.length ?? 0,
    attachmentCount: task.attachments?.length ?? 0,
    deadline: task.deadline,
    task,
  };
}

const EMPTY_HUBS: OrbitHubData[] = [
  createEmptyHubData("ideas"),
  createEmptyHubData("development"),
  createEmptyHubData("testing"),
  createEmptyHubData("review"),
  createEmptyHubData("completed"),
];

export function useOrbitData(projectId?: string) {
  const tasksQuery = useQuery({
    queryKey: projectId ? queryKeys.tasks.board(projectId) : ["tasks", "board", "none"],
    queryFn: () => tasksApi.list({ projectId: projectId! }),
    enabled: !!projectId,
  });

  const ideasQuery = useQuery({
    queryKey: queryKeys.orbit.ideas(projectId),
    queryFn: () => orbitIdeasApi.list(projectId!),
    enabled: !!projectId,
  });

  const allTasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const ideas = useMemo(() => ideasQuery.data ?? [], [ideasQuery.data]);

  const hasData = !!projectId;

  const hubs = useMemo<OrbitHubData[]>(() => {
    if (!hasData) return EMPTY_HUBS;

    const ideasHub = createEmptyHubData("ideas");

    ideasHub.cards = ideas.map((idea) => ({
      id: idea.id,
      hubType: "ideas" as OrbitHubType,
      title: idea.title,
      description: idea.description,
      priority: idea.priority,
      status: idea.status,
      assignees: idea.members?.map((m) => m.user).filter((u): u is NonNullable<typeof u> => u != null) ?? [],
      tags: idea.labels ?? [],
      commentCount: idea.commentCount ?? 0,
      attachmentCount: 0,
      deadline: idea.dueDate,
      idea,
    }));
    ideasHub.count = ideasHub.cards.length;
    ideasHub.progress = computeHubProgress(ideasHub.cards);

    const developmentHub = createEmptyHubData("development");
    const tasksInDev = allTasks.filter((t) => t.status === "in_progress" || t.status === "todo");
    developmentHub.cards = tasksInDev.map((t) => taskToOrbitCard(t, "development"));
    developmentHub.count = developmentHub.cards.length;
    developmentHub.progress = computeHubProgress(developmentHub.cards);

    const testingHub = createEmptyHubData("testing");
    const tasksInTesting = allTasks.filter(
      (t) => t.status === "in_progress" && t.tags?.some((tag) => tag.name.toLowerCase().includes("test")),
    );
    testingHub.cards = tasksInTesting.map((t) => taskToOrbitCard(t, "testing"));
    testingHub.count = testingHub.cards.length;
    testingHub.progress = computeHubProgress(testingHub.cards);

    const reviewHub = createEmptyHubData("review");
    const tasksInReview = allTasks.filter((t) => t.status === "review");
    reviewHub.cards = tasksInReview.map((t) => taskToOrbitCard(t, "review"));
    reviewHub.count = reviewHub.cards.length;
    reviewHub.progress = computeHubProgress(reviewHub.cards);

    const completedHub = createEmptyHubData("completed");
    const tasksCompleted = allTasks.filter((t) => t.status === "done");
    completedHub.cards = tasksCompleted.map((t) => taskToOrbitCard(t, "completed"));
    completedHub.count = completedHub.cards.length;
    completedHub.progress = completedHub.count > 0 ? 100 : 0;

    return [ideasHub, developmentHub, testingHub, reviewHub, completedHub];
  }, [allTasks, ideas, hasData]);

  return {
    hubs,
    allTasks,
    ideas,
    isLoading: hasData && (tasksQuery.isLoading || ideasQuery.isLoading),
    error: hasData ? (tasksQuery.error || ideasQuery.error) : null,
    refetch: () => {
      if (hasData) {
        tasksQuery.refetch();
        ideasQuery.refetch();
      }
    },
  };
}
