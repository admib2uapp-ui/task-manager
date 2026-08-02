"use client";

import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials, formatDeadlineDate, isDeadlineOverdue } from "@/lib/format";
import type { OrbitCard } from "@/features/orbit-view/types";
import { IDEA_PRIORITY_COLORS } from "@/features/orbit-view/types";
import type { ReactNode } from "react";

interface OrbitCardBaseProps {
  card: OrbitCard;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  hubColor?: string;
}

export function OrbitCardBase({
  card,
  children,
  onClick,
  className,
  compact = false,
}: OrbitCardBaseProps) {
  const priorityColor = IDEA_PRIORITY_COLORS[card.priority as keyof typeof IDEA_PRIORITY_COLORS] ?? "#71717a";
  const isOverdue = card.deadline && isDeadlineOverdue(card.deadline);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 100,
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={onClick}
      className={cn(
        "orbit-card-glass group cursor-grab rounded-2xl border transition-all select-none",
        isDragging && "shadow-glow rotate-2 opacity-90 cursor-grabbing",
        compact ? "p-2" : "p-3",
        className,
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Priority color bar */}
      <div
        className="mb-2 h-1 rounded-full transition-all group-hover:h-1.5"
        style={{
          backgroundColor: priorityColor,
          width: compact ? "40%" : "60%",
          boxShadow: `0 0 8px ${priorityColor}60`,
        }}
      />

      {/* Title */}
      <h4
        className={cn(
          "line-clamp-2 font-medium leading-snug",
          compact ? "text-[11px]" : "text-xs sm:text-sm",
        )}
      >
        {card.title}
      </h4>

      {/* Description preview */}
      {card.description && !compact && (
        <p className="text-muted-foreground mt-1 line-clamp-2 text-[10px] leading-relaxed sm:text-xs">
          {card.description}
        </p>
      )}

      {/* Footer */}
      <div className={cn("flex items-center gap-2", compact ? "mt-1.5" : "mt-2.5")}>
        {/* Assignee avatars */}
        {card.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {card.assignees.slice(0, 3).map((user) => (
              <Avatar key={user.id} className="size-5 border border-background ring-1 ring-background sm:size-6">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[8px] font-medium sm:text-[10px]">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
          {/* Deadline */}
          {card.deadline && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[9px] sm:text-[10px]",
                isOverdue && "text-danger font-medium",
              )}
            >
              {formatDeadlineDate(card.deadline)}
            </span>
          )}

          {/* Comments */}
          {card.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px]">
              💬 {card.commentCount}
            </span>
          )}

          {/* Attachments */}
          {card.attachmentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px]">
              📎 {card.attachmentCount}
            </span>
          )}
        </div>
      </div>

      {/* Custom children */}
      {children}
    </motion.div>
  );
}
