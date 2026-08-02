"use client";

import { OrbitCardBase } from "@/features/orbit-view/components/cards/orbit-card-base";
import type { OrbitCard } from "@/features/orbit-view/types";

interface ReviewCardProps {
  card: OrbitCard;
  compact?: boolean;
  onClick?: () => void;
  reviewStatus?: "pending" | "approved" | "changes_requested";
}

export function ReviewCard({ card, compact, onClick, reviewStatus = "pending" }: ReviewCardProps) {
  const statusConfig = {
    pending: { label: "Pending", color: "#f59e0b" },
    approved: { label: "Approved", color: "#22c55e" },
    changes_requested: { label: "Changes", color: "#ef4444" },
  };

  const config = statusConfig[reviewStatus];

  return (
    <OrbitCardBase card={card} onClick={onClick} compact={compact} hubColor="#f59e0b">
      {!compact && (
        <div className="mt-2 flex items-center gap-2">
          {/* Review status badge */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium sm:text-[10px]"
            style={{
              backgroundColor: `color-mix(in srgb, ${config.color} 16%, transparent)`,
              color: config.color,
            }}
          >
            {reviewStatus === "approved" ? "✅" : reviewStatus === "changes_requested" ? "🔄" : "⏳"} {config.label}
          </span>

          {/* Reviewer info */}
          {card.assignees.length > 0 && (
            <span className="text-muted-foreground text-[9px] sm:text-[10px]">
              by {card.assignees[0]?.name}
            </span>
          )}
        </div>
      )}
    </OrbitCardBase>
  );
}
