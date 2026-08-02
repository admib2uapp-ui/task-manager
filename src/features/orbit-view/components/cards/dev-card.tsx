"use client";

import { motion } from "framer-motion";
import { GitBranch } from "lucide-react";
import { OrbitCardBase } from "@/features/orbit-view/components/cards/orbit-card-base";
import { computeTaskProgress } from "@/features/orbit-view/lib/utils";
import type { OrbitCard } from "@/features/orbit-view/types";

interface DevCardProps {
  card: OrbitCard;
  compact?: boolean;
  onClick?: () => void;
}

export function DevCard({ card, compact, onClick }: DevCardProps) {
  const task = card.task;
  if (!task) return null;

  const progress = computeTaskProgress(task);
  const subtaskTotal = task.subtasks?.length ?? 0;
  const subtaskDone = task.subtasks?.filter((s) => s.completed).length ?? 0;

  return (
    <OrbitCardBase card={card} onClick={onClick} compact={compact} hubColor="#3b82f6">
      {/* Progress bar */}
      {!compact && (
        <div className="mt-2">
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "#3b82f6" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px] sm:text-[10px]">
            <span className="text-muted-foreground">
              {subtaskDone}/{subtaskTotal} subtasks
            </span>
            <span className="font-medium" style={{ color: "#3b82f6" }}>
              {progress}%
            </span>
          </div>
        </div>
      )}

      {/* GitHub info */}
      {task.githubBranch && !compact && (
        <div className="mt-1.5 flex items-center gap-1 text-muted-foreground">
          <GitBranch className="size-2.5 sm:size-3" />
          <span className="truncate text-[9px] sm:text-[10px]">
            {task.githubBranch}
          </span>
        </div>
      )}

      {/* Time tracking */}
      {task.timeSpentSeconds > 0 && !compact && (
        <p className="text-muted-foreground mt-0.5 text-[9px] sm:text-[10px]">
          🕐 {Math.round(task.timeSpentSeconds / 3600)}h
          {task.estimatedHours ? ` / ${task.estimatedHours}h` : ""}
        </p>
      )}
    </OrbitCardBase>
  );
}
