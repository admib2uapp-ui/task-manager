"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrbitProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
  className?: string;
  showPercentage?: boolean;
}

export function OrbitProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = "#3b82f6",
  glowColor,
  className,
  showPercentage = true,
}: OrbitProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={`glow-${color.replace("#", "")}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={glowColor ?? color} stopOpacity={0.6} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/40"
        />

        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${color.replace("#", "")})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          filter={glowColor ? `url(#glow-${color.replace("#", "")})` : undefined}
          style={{
            filter: glowColor
              ? undefined
              : `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
      </svg>

      {showPercentage && (
        <span className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-xs font-bold tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color }}
          >
            {Math.round(progress)}%
          </motion.span>
        </span>
      )}
    </div>
  );
}
