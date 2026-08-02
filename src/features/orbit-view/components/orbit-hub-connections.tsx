"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { OrbitHubType } from "@/features/orbit-view/types";
import { ORBIT_HUB_META } from "@/features/orbit-view/types";

interface HubPosition {
  x: number;
  y: number;
  type: OrbitHubType;
}

interface OrbitHubConnectionsProps {
  hubPositions: HubPosition[];
  animated?: boolean;
}

export function OrbitHubConnections({ hubPositions, animated = true }: OrbitHubConnectionsProps) {
  const connections = useMemo(() => {
    const result: Array<{ from: HubPosition; to: HubPosition; key: string }> = [];
    for (let i = 0; i < hubPositions.length - 1; i++) {
      result.push({
        from: hubPositions[i],
        to: hubPositions[i + 1],
        key: `${hubPositions[i].type}-${hubPositions[i + 1].type}`,
      });
    }
    return result;
  }, [hubPositions]);

  return (
    <svg className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <linearGradient id="orbit-connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
          <stop offset="25%" stopColor="#3b82f6" stopOpacity={0.6} />
          <stop offset="50%" stopColor="#22c55e" stopOpacity={0.6} />
          <stop offset="75%" stopColor="#f59e0b" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
        </linearGradient>
      </defs>

      {connections.map(({ from, to, key }) => {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2 - 40;

        const d = `M ${from.x} ${from.y} Q ${midX} ${midY}, ${to.x} ${to.y}`;

        return (
          <g key={key}>
            {/* Glow line behind */}
            <motion.path
              d={d}
              stroke="currentColor"
              strokeWidth={6}
              fill="none"
              className="text-primary/10"
              initial={{ pathLength: 0 }}
              animate={animated ? { pathLength: 1 } : undefined}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
              style={{ filter: "blur(8px)" }}
            />

            {/* Main gradient line */}
            <motion.path
              d={d}
              stroke="url(#orbit-connection-gradient)"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              className="orbit-flow-line"
              initial={{ pathLength: 0 }}
              animate={animated ? { pathLength: 1 } : undefined}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
            />

            {/* Animated particle along the path */}
            {animated && (
              <motion.circle
                r={3}
                fill={ORBIT_HUB_META[from.type]?.color ?? "#3b82f6"}
                filter="url(#orbit-particle-glow)"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.5,
                }}
                style={{
                  offsetPath: `path('${d}')`,
                  offsetRotate: "0deg",
                }}
              />
            )}
          </g>
        );
      })}

      {/* Particle glow filter */}
      <defs>
        <filter id="orbit-particle-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
