"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DepGraphNodeProps {
  id: string;
  label: string;
  type: "idea" | "task" | "bug" | "testing" | "review" | "milestone";
  status: string;
  x: number;
  y: number;
  isHighlighted?: boolean;
  onClick?: () => void;
  onHover?: (id: string | null) => void;
}

const TYPE_ICONS: Record<string, string> = {
  idea: "💡",
  task: "📋",
  bug: "🐛",
  testing: "🧪",
  review: "👀",
  milestone: "🏁",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "#71717a",
  todo: "#a1a1aa",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#22c55e",
  approved: "#22c55e",
  blocked: "#ef4444",
  draft: "#71717a",
  submitted: "#3b82f6",
};

export function DepGraphNode({
  id,
  label,
  type,
  status,
  x,
  y,
  isHighlighted,
  onClick,
  onHover,
}: DepGraphNodeProps) {
  const color = STATUS_COLORS[status] ?? "#71717a";
  const radius = type === "milestone" ? 20 : type === "idea" ? 14 : 16;

  return (
    <motion.g
      className="cursor-pointer"
      style={{ transform: `translate(${x}px, ${y}px)` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Glow ring */}
      {isHighlighted && (
        <circle
          r={radius + 8}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.4}
          className="orbit-risk-glow"
        />
      )}

      {/* Main circle */}
      <circle
        r={radius}
        fill={`color-mix(in srgb, ${color} 20%, var(--card))`}
        stroke={color}
        strokeWidth={isHighlighted ? 2.5 : 1.5}
        className="transition-all"
      />

      {/* Type icon */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={type === "milestone" ? 16 : 12}
        style={{ pointerEvents: "none" }}
      >
        {TYPE_ICONS[type] ?? "📌"}
      </text>

      {/* Label */}
      <foreignObject
        x={-60}
        y={radius + 6}
        width={120}
        height={32}
        style={{ pointerEvents: "none" }}
      >
        <div className="flex justify-center">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-medium leading-tight text-center",
              "bg-background/80 backdrop-blur-sm",
              isHighlighted && "shadow-glow",
            )}
            style={{ color }}
          >
            {label.length > 18 ? label.slice(0, 16) + "..." : label}
          </span>
        </div>
      </foreignObject>
    </motion.g>
  );
}
