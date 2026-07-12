"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";
import { KANBAN_COLUMNS } from "@/config/constants";
import { KanbanColumn } from "@/features/tasks/components/kanban-column";
import { TaskCard } from "@/features/tasks/components/task-card";
import { useMoveTask } from "@/features/tasks/hooks/use-tasks";
import type { Task, TaskStatus } from "@/types/domain";

type Columns = Record<TaskStatus, Task[]>;

function groupByStatus(tasks: Task[]): Columns {
  const cols = Object.fromEntries(
    KANBAN_COLUMNS.map((s) => [s, [] as Task[]]),
  ) as Columns;
  for (const task of [...tasks].sort((a, b) => a.position - b.position)) {
    cols[task.status]?.push(task);
  }
  return cols;
}

function computePosition(items: Task[], index: number): number {
  const prev = items[index - 1]?.position;
  const next = items[index + 1]?.position;
  if (prev == null && next == null) return 1024;
  if (prev == null) return next! / 2;
  if (next == null) return prev + 1024;
  return (prev + next) / 2;
}

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function KanbanBoard({
  projectId,
  tasks,
  onOpenTask,
  onAddTask,
}: KanbanBoardProps) {
  const move = useMoveTask(projectId);
  const [columns, setColumnsState] = useState<Columns>(() =>
    groupByStatus(tasks),
  );
  const columnsRef = useRef<Columns>(columns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [collapsed, setCollapsed] = useState<Set<TaskStatus>>(new Set());
  const draggingRef = useRef(false);

  const setColumns = useCallback((updater: (prev: Columns) => Columns) => {
    setColumnsState((prev) => {
      const next = updater(prev);
      columnsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!draggingRef.current) {
      const grouped = groupByStatus(tasks);
      columnsRef.current = grouped;
      setColumnsState(grouped);
    }
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findContainer = useCallback((id: string): TaskStatus | undefined => {
    if (KANBAN_COLUMNS.includes(id as TaskStatus)) return id as TaskStatus;
    return KANBAN_COLUMNS.find((s) =>
      columnsRef.current[s].some((t) => t.id === id),
    );
  }, []);

  function handleDragStart(event: DragStartEvent) {
    draggingRef.current = true;
    const id = String(event.active.id);
    const container = findContainer(id);
    if (container) {
      setActiveTask(
        columnsRef.current[container].find((t) => t.id === id) ?? null,
      );
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = findContainer(activeId);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromItems = [...prev[from]];
      const toItems = [...prev[to]];
      const activeIndex = fromItems.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;
      const [moved] = fromItems.splice(activeIndex, 1);
      let overIndex = toItems.findIndex((t) => t.id === overId);
      if (overIndex === -1) overIndex = toItems.length;
      toItems.splice(overIndex, 0, { ...moved, status: to });
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    draggingRef.current = false;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const container = findContainer(activeId);
    if (!container) return;

    const items = [...columnsRef.current[container]];
    const oldIndex = items.findIndex((t) => t.id === activeId);
    const overId = String(over.id);
    let newIndex = items.findIndex((t) => t.id === overId);
    if (newIndex === -1) newIndex = items.length - 1;

    const reordered =
      oldIndex !== newIndex && oldIndex !== -1
        ? arrayMove(items, oldIndex, newIndex)
        : items;

    setColumns((prev) => ({ ...prev, [container]: reordered }));

    const finalIndex = reordered.findIndex((t) => t.id === activeId);
    const position = computePosition(reordered, finalIndex);
    move.mutate({ id: activeId, status: container, position });
  }

  function toggleCollapse(status: TaskStatus) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full scrollbar-thin gap-4 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columns[status]}
            collapsed={collapsed.has(status)}
            onToggleCollapse={() => toggleCollapse(status)}
            onAdd={onAddTask}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-72">
            <TaskCard task={activeTask} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
