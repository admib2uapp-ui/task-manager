"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrbitFilters as OrbitFiltersType, OrbitHubType, IdeaPriority } from "@/features/orbit-view/types";

interface FilterOption {
  id: string;
  label: string;
  color?: string;
}

interface OrbitFiltersProps {
  filters: OrbitFiltersType;
  onChange: (filters: OrbitFiltersType) => void;
  availableSprints?: FilterOption[];
  availableMembers?: FilterOption[];
  availableLabels?: FilterOption[];
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS: FilterOption[] = [
  { id: "critical", label: "Critical", color: "#ef4444" },
  { id: "high", label: "High", color: "#f59e0b" },
  { id: "medium", label: "Medium", color: "#3b82f6" },
  { id: "low", label: "Low", color: "#71717a" },
];

const STATUS_OPTIONS: FilterOption[] = [
  { id: "ideas", label: "Ideas", color: "#a855f7" },
  { id: "development", label: "Development", color: "#3b82f6" },
  { id: "testing", label: "Testing", color: "#22c55e" },
  { id: "review", label: "Review", color: "#f59e0b" },
  { id: "completed", label: "Completed", color: "#22c55e" },
];

export function OrbitFilters({
  filters,
  onChange,
  availableSprints = [],
  availableMembers = [],
  availableLabels = [],
  isOpen,
  onClose,
}: OrbitFiltersProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleFilter = useCallback(
    (key: keyof OrbitFiltersType, value: string) => {
      const current = filters[key];
      if (Array.isArray(current)) {
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        onChange({ ...filters, [key]: next });
      } else {
        onChange({ ...filters, [key]: filters[key] === value ? undefined : value });
      }
    },
    [filters, onChange],
  );

  const clearAll = useCallback(() => {
    onChange({});
  }, [onChange]);

  const activeCount = Object.values(filters).filter(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
  ).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute right-0 top-full z-40 mt-2 w-[280px]"
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <div className="orbit-card-glass rounded-2xl border shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <Filter className="text-muted-foreground size-3.5" />
                <span className="text-xs font-medium">Filters</span>
                {activeCount > 0 && (
                  <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium">
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {activeCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-muted-foreground hover:text-foreground rounded-lg px-1.5 py-0.5 text-[9px] transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Filter sections */}
            <div className="max-h-[320px] overflow-y-auto p-2">
              <FilterSection
                label="Status"
                options={STATUS_OPTIONS}
                selected={filters.status ? [filters.status] : []}
                onToggle={(val) => toggleFilter("status", val)}
                isOpen={activeSection === "status"}
                onToggleOpen={() =>
                  setActiveSection(activeSection === "status" ? null : "status")
                }
              />
              <FilterSection
                label="Priority"
                options={PRIORITY_OPTIONS}
                selected={filters.priority ? [filters.priority] : []}
                onToggle={(val) => toggleFilter("priority", val)}
                isOpen={activeSection === "priority"}
                onToggleOpen={() =>
                  setActiveSection(activeSection === "priority" ? null : "priority")
                }
              />
              {availableMembers.length > 0 && (
                <FilterSection
                  label="Member"
                  options={availableMembers}
                  selected={filters.memberId ? [filters.memberId] : []}
                  onToggle={(val) => toggleFilter("memberId", val)}
                  isOpen={activeSection === "member"}
                  onToggleOpen={() =>
                    setActiveSection(activeSection === "member" ? null : "member")
                  }
                />
              )}
              {availableLabels.length > 0 && (
                <FilterSection
                  label="Label"
                  options={availableLabels}
                  selected={filters.tags ?? []}
                  onToggle={(val) => {
                    const current = filters.tags ?? [];
                    const next = current.includes(val)
                      ? current.filter((v) => v !== val)
                      : [...current, val];
                    onChange({ ...filters, tags: next });
                  }}
                  isOpen={activeSection === "label"}
                  onToggleOpen={() =>
                    setActiveSection(activeSection === "label" ? null : "label")
                  }
                />
              )}
            </div>

            {/* Active filter chips */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-1 border-t border-border/30 p-2.5">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  const val = key === "status" ? `Status: ${value}` : `${key}: ${value}`;
                  return (
                    <span
                      key={key}
                      className="bg-muted/50 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px]"
                    >
                      {val}
                      <button
                        onClick={() => toggleFilter(key as keyof OrbitFiltersType, "")}
                        className="hover:text-foreground ml-0.5"
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FilterSection({
  label,
  options,
  selected,
  onToggle,
  isOpen,
  onToggleOpen,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (val: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}) {
  return (
    <div className="border-b border-border/20 last:border-0">
      <button
        onClick={onToggleOpen}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/30"
      >
        <span className="text-[10px] font-medium">{label}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-3 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="space-y-0.5 px-2 pb-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => onToggle(opt.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-[10px] transition-colors",
                    isSelected ? "bg-muted/50" : "hover:bg-muted/20",
                  )}
                >
                  {opt.color && (
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  <span className="flex-1">{opt.label}</span>
                  {isSelected && <span className="text-primary text-[9px]">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
