"use client";

import { OrbitCardBase } from "@/features/orbit-view/components/cards/orbit-card-base";
import type { OrbitCard } from "@/features/orbit-view/types";

interface TestingCardProps {
  card: OrbitCard;
  compact?: boolean;
  onClick?: () => void;
  passCount?: number;
  failCount?: number;
}

export function TestingCard({ card, compact, onClick, passCount = 0, failCount = 0 }: TestingCardProps) {
  return (
    <OrbitCardBase card={card} onClick={onClick} compact={compact} hubColor="#22c55e">
      {!compact && (
        <>
          {/* Pass/Fail badges */}
          <div className="mt-2 flex items-center gap-2">
            {passCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium sm:text-[10px]"
                style={{
                  backgroundColor: "color-mix(in srgb, #22c55e 16%, transparent)",
                  color: "#22c55e",
                }}
              >
                ✓ {passCount} passed
              </span>
            )}
            {failCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium sm:text-[10px]"
                style={{
                  backgroundColor: "color-mix(in srgb, #ef4444 16%, transparent)",
                  color: "#ef4444",
                }}
              >
                ✗ {failCount} failed
              </span>
            )}
          </div>

          {/* Testing progress indicator */}
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const isActive = i < Math.round(((passCount + failCount) / Math.max(passCount + failCount, 1)) * 5);
              const isPass = i < Math.round((passCount / Math.max(passCount + failCount, 1)) * 5);
              return (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? isPass
                        ? "color-mix(in srgb, #22c55e 40%, transparent)"
                        : "color-mix(in srgb, #ef4444 40%, transparent)"
                      : "var(--border)",
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </OrbitCardBase>
  );
}
