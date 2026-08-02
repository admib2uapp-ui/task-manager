"use client";

import { motion } from "framer-motion";
import { OrbitCardBase } from "@/features/orbit-view/components/cards/orbit-card-base";
import type { OrbitCard } from "@/features/orbit-view/types";

interface IdeaCardProps {
  card: OrbitCard;
  compact?: boolean;
  onClick?: () => void;
  onVote?: (ideaId: string) => void;
  onReact?: (ideaId: string, emoji: string) => void;
}

export function IdeaCard({ card, compact, onClick, onVote, onReact }: IdeaCardProps) {
  const idea = card.idea;
  if (!idea) return null;

  return (
    <OrbitCardBase card={card} onClick={onClick} compact={compact} hubColor="#a855f7">
      {/* Labels */}
      {idea.labels && idea.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {idea.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="bg-muted rounded-full px-1.5 py-0.5 text-[8px] font-medium sm:text-[10px]"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* AI Summary badge */}
      {idea.aiSummary && (
        <motion.span
          className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-medium sm:text-[10px]"
          style={{
            backgroundColor: "color-mix(in srgb, #a855f7 16%, transparent)",
            color: "#a855f7",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          ✨ AI
        </motion.span>
      )}

      {/* Votes & Reactions row */}
      <div className="mt-2 flex items-center gap-2">
        {/* Vote button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote?.(idea.id);
          }}
          className="bg-muted hover:bg-muted/80 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition-colors"
        >
          ▲ <span>{idea.voteCount ?? 0}</span>
        </button>

        {/* Quick reactions */}
        {["👍", "❤️", "🚀"].map((emoji) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              onReact?.(idea.id, emoji);
            }}
            className="hover:bg-muted/80 rounded-full px-1 py-0.5 text-xs transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </OrbitCardBase>
  );
}
