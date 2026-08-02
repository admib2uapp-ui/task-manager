"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, User, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiskColor } from "@/features/orbit-view/lib/utils";
import type { OrbitRiskNode, OrbitCard } from "@/features/orbit-view/types";
import { RISK_TYPE_LABELS } from "@/features/orbit-view/types";

interface OrbitRiskNodesProps {
  risks: OrbitRiskNode[];
  cards?: OrbitCard[];
  className?: string;
  onResolve?: (riskId: string) => void;
}

export function OrbitRiskNodes({
  risks,
  cards,
  className,
  onResolve,
}: OrbitRiskNodesProps) {
  const [selectedRisk, setSelectedRisk] = useState<OrbitRiskNode | null>(null);
  const [expanded, setExpanded] = useState(false);

  const activeRisks = risks.filter((r) => r.status === "active");
  const highRisks = activeRisks.filter((r) => r.riskScore >= 5);

  if (activeRisks.length === 0) return null;

  return (
    <>
      {/* Risk indicator badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "orbit-card-glass fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border p-2 shadow-lg transition-all hover:shadow-xl",
          highRisks.length > 0 && "orbit-risk-glow",
          className,
        )}
        style={{
          borderColor: highRisks.length > 0 ? "#ef4444" : "#f59e0b",
        }}
      >
        <div className="relative">
          <AlertTriangle
            className="size-4 sm:size-5"
            style={{ color: highRisks.length > 0 ? "#ef4444" : "#f59e0b" }}
          />
          <span
            className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white sm:size-4.5"
            style={{ backgroundColor: highRisks.length > 0 ? "#ef4444" : "#f59e0b" }}
          >
            {activeRisks.length}
          </span>
        </div>
        <span className="hidden text-[10px] font-medium sm:inline">
          {activeRisks.length} risk{activeRisks.length !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Risk panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="fixed bottom-20 left-6 z-40 w-[300px] sm:w-[340px]"
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
          >
            <div className="orbit-card-glass max-h-[400px] overflow-hidden rounded-2xl border shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" style={{ color: "#ef4444" }} />
                  <span className="text-xs font-medium">Risk Nodes</span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Risk list */}
              <div className="scrollbar-thin space-y-1.5 overflow-y-auto p-2">
                {activeRisks.map((risk) => {
                  const color = getRiskColor(risk.riskScore);
                  return (
                    <motion.button
                      key={risk.id}
                      onClick={() => setSelectedRisk(selectedRisk?.id === risk.id ? null : risk)}
                      className="flex w-full items-start gap-2.5 rounded-xl border border-border/30 p-2.5 text-left transition-colors hover:bg-muted/30"
                      layout
                    >
                      {/* Risk indicator */}
                      <div
                        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                        }}
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor: color,
                            boxShadow: `0 0 8px ${color}`,
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium">
                            {RISK_TYPE_LABELS[risk.riskType] ?? risk.riskType}
                          </span>
                          <span
                            className="ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                              color,
                            }}
                          >
                            {risk.riskScore}
                          </span>
                        </div>
                        {risk.owner && (
                          <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                            <User className="size-2.5" />
                            {risk.owner.name}
                          </div>
                        )}

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {selectedRisk?.id === risk.id && (
                            <motion.div
                              className="mt-2 space-y-1.5 border-t border-border/20 pt-2"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              {risk.resolutionSuggestion && (
                                <div className="flex items-start gap-1.5 text-[9px] text-muted-foreground">
                                  <Lightbulb className="mt-0.5 size-2.5 shrink-0 text-warning" />
                                  <span>{risk.resolutionSuggestion}</span>
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResolve?.(risk.id);
                                }}
                                className="text-[9px] font-medium text-success hover:underline"
                              >
                                Mark as resolved
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="border-t border-border/30 px-3 py-1.5">
                <p className="text-muted-foreground/50 text-center text-[9px]">
                  {highRisks.length} high priority · {activeRisks.length} total
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
