"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { OrbitProgressRing } from "@/features/orbit-view/components/orbit-progress-ring";
import type { OrbitHubType, OrbitCard } from "@/features/orbit-view/types";
import { ORBIT_HUB_META } from "@/features/orbit-view/types";
import { getHubEmoji } from "@/features/orbit-view/lib/icons";

import type { User } from "@/types/domain";

interface OrbitHubNodeProps {
  type: OrbitHubType;
  cards: OrbitCard[];
  progress: number;
  count: number;
  onOpenFullViz?: () => void;
  renderCard?: (card: OrbitCard) => React.ReactNode;
}

export function OrbitHubNode({
  type,
  cards,
  progress,
  count,
  onOpenFullViz,
  renderCard,
}: OrbitHubNodeProps) {
  const meta = ORBIT_HUB_META[type];
  const { setNodeRef, isOver } = useDroppable({
    id: type,
    data: { type: "hub", hubType: type },
  });

  // Extract unique team members from the cards
  const assignees = useMemo(() => {
    const memberMap = new Map<string, User>();
    cards.forEach((card) => {
      card.assignees?.forEach((user) => {
        if (!memberMap.has(user.id)) {
          memberMap.set(user.id, user);
        }
      });
    });
    return Array.from(memberMap.values());
  }, [cards]);

  return (
    <motion.div
      className="flex flex-col items-center gap-4 relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Circular hub node */}
      <motion.button
        onClick={onOpenFullViz}
        className={cn(
          "orbit-card-glass relative flex size-44 cursor-pointer flex-col items-center justify-center rounded-full transition-all sm:size-48",
          isOver && "scale-105",
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${meta.color}20, transparent 80%)`,
          borderWidth: "2px",
          borderColor: isOver ? meta.color : `${meta.color}60`,
        }}
      >
        {/* Glow effect */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full opacity-40"
          style={{
            background: `radial-gradient(circle at center, ${meta.color}40, transparent 75%)`,
            filter: "blur(15px)",
          }}
        />

        {/* Progress ring */}
        <OrbitProgressRing
          progress={progress}
          size={160}
          strokeWidth={4}
          color={meta.color}
          className="absolute scale-90 sm:scale-100"
          showPercentage={false}
        />

        {/* Custom content representing the mockup details inside the circle */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Hub Icon */}
          <span className="text-xl sm:text-2xl mb-1 opacity-80">
            {getHubEmoji(type)}
          </span>
          {/* Label */}
          <span className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">{meta.label}</span>
          {/* Count */}
          <span className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">{count}</span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
            {type === "ideas" ? "ideas" : type === "development" ? "tasks" : type === "testing" ? "tests" : type === "review" ? "reviews" : "done"}
          </span>
          {/* Percentage */}
          <span className="text-[10px] sm:text-[11px] font-bold mt-1" style={{ color: meta.color }}>{Math.round(progress)}%</span>
        </div>
      </motion.button>

      {/* Assignee Avatars below the circle */}
      {assignees.length > 0 && (
        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex -space-x-1.5 overflow-hidden">
            {assignees.slice(0, 4).map((user) => (
              <div
                key={user.id}
                className="inline-block size-5 rounded-full border border-slate-950 bg-indigo-600 text-[8px] font-bold flex items-center justify-center text-white"
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
          </div>
          {assignees.length > 4 && (
            <span className="text-[9px] text-slate-400 font-medium ml-1">+{assignees.length - 4}</span>
          )}
        </div>
      )}

      {/* Cards list preview below */}
      {cards.length > 0 && (
        <div ref={setNodeRef} className="flex w-full max-w-[210px] flex-col gap-1.5 mt-2 bg-slate-950/20 p-2.5 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              {type === "ideas" ? "Top Ideas" : type === "development" ? "Current Tasks" : type === "testing" ? "Testing Progress" : type === "review" ? "Review Progress" : "Completed"}
            </span>
            <span className="text-[9px] text-indigo-400 font-bold hover:underline cursor-pointer" onClick={onOpenFullViz}>View all</span>
          </div>
          {cards.slice(0, 3).map((card) => (
            <div key={card.id}>{renderCard?.(card)}</div>
          ))}
          {cards.length > 3 && (
            <p
              className="text-muted-foreground cursor-pointer text-center text-[10px] font-medium hover:underline pt-1"
              onClick={onOpenFullViz}
            >
              +{cards.length - 3} more
            </p>
          )}
        </div>
      )}

      {cards.length === 0 && (
        <div
          ref={setNodeRef}
          className="border-border/30 flex min-h-[50px] w-full max-w-[210px] items-center justify-center rounded-xl border border-dashed mt-2 bg-slate-950/20"
        >
          <p className="text-muted-foreground/40 text-[9px] sm:text-[10px]">
            Drop cards here
          </p>
        </div>
      )}
    </motion.div>
  );
}
