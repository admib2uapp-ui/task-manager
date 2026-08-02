"use client";

import { motion } from "framer-motion";
import { OrbitCardBase } from "@/features/orbit-view/components/cards/orbit-card-base";
import type { OrbitCard } from "@/features/orbit-view/types";

interface CompletedCardProps {
  card: OrbitCard;
  compact?: boolean;
  onClick?: () => void;
}

export function CompletedCard({ card, compact, onClick }: CompletedCardProps) {
  const task = card.task;

  return (
    <OrbitCardBase card={card} onClick={onClick} compact={compact} hubColor="#22c55e">
      {!compact && (
        <div className="mt-2 flex items-center gap-2">
          {/* Completion checkmark */}
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="flex size-5 items-center justify-center rounded-full sm:size-6"
            style={{
              backgroundColor: "color-mix(in srgb, #22c55e 20%, transparent)",
            }}
          >
            <span className="text-[10px] sm:text-xs">✓</span>
          </motion.span>

          {/* Time spent */}
          {task?.timeSpentSeconds != null && task.timeSpentSeconds > 0 && (
            <span className="text-muted-foreground text-[9px] sm:text-[10px]">
              🕐 {Math.round(task.timeSpentSeconds / 3600)}h
            </span>
          )}

          {/* Performance indicator */}
          <span
            className="ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-medium sm:text-[10px]"
            style={{
              backgroundColor: "color-mix(in srgb, #22c55e 16%, transparent)",
              color: "#22c55e",
            }}
          >
            ✓ Done
          </span>
        </div>
      )}
    </OrbitCardBase>
  );
}
