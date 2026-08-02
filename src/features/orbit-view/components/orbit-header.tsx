"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, RefreshCw, Sparkles, Layout, Orbit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrbitViewMode } from "@/features/orbit-view/types";

interface OrbitHeaderProps {
  viewMode: OrbitViewMode;
  onViewModeChange: (mode: OrbitViewMode) => void;
  onSearch?: () => void;
  onRefreshAnalytics?: () => void;
  onToggleFilters?: () => void;
  onToggleAI?: () => void;
  aiPanelOpen?: boolean;
  isRefreshing?: boolean;
}

export function OrbitHeader({
  viewMode,
  onViewModeChange,
  onSearch,
  onRefreshAnalytics,
  onToggleFilters,
  onToggleAI,
  isRefreshing,
}: OrbitHeaderProps) {
  const [searchValue] = useState("");

  const viewModes: Array<{ mode: OrbitViewMode; label: string; icon: typeof Layout }> = [
    { mode: "workspace", label: "Workspace", icon: Layout },
    { mode: "full-viz", label: "Full Viz", icon: Orbit },
    { mode: "galaxy", label: "Galaxy", icon: Orbit },
  ];

  return (
    <div className="border-border/50 orbit-card-glass mb-6 flex items-center gap-2 rounded-2xl border p-2 sm:gap-3 sm:p-3">
      {/* Logo / Title */}
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 flex size-8 items-center justify-center rounded-xl sm:size-9">
          <Orbit className="text-primary size-4 sm:size-5" />
        </div>
        <div className="hidden sm:block">
          <h1 className="orbit-gradient-text text-sm font-bold leading-tight">
            Orbit View
          </h1>
          <p className="text-muted-foreground text-[9px] leading-tight">
            Visual Project Workspace
          </p>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="bg-muted/50 ml-auto flex items-center gap-0.5 rounded-xl p-0.5">
        {viewModes.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all sm:px-3 sm:text-xs",
              viewMode === mode
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          onClick={onSearch}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors sm:p-2"
          aria-label="Search"
        >
          <Search className="size-3.5 sm:size-4" />
        </button>

        {/* Filters */}
        <button
          onClick={onToggleFilters}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors sm:p-2"
          aria-label="Filters"
        >
          <Filter className="size-3.5 sm:size-4" />
        </button>

        {/* AI Suggestions */}
        <button
          onClick={onToggleAI}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors sm:p-2"
          aria-label="AI Suggestions"
        >
          <Sparkles className="size-3.5 sm:size-4" />
        </button>

        {/* Refresh */}
        <button
          onClick={onRefreshAnalytics}
          disabled={isRefreshing}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors disabled:opacity-50 sm:p-2"
          aria-label="Refresh"
        >
          <RefreshCw
            className={cn("size-3.5 sm:size-4", isRefreshing && "animate-spin")}
          />
        </button>
      </div>
    </div>
  );
}
