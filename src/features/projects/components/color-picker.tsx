"use client";

import { Check } from "lucide-react";
import { PROJECT_COLORS } from "@/config/constants";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((color) => {
        const active = value.toLowerCase() === color.toLowerCase();
        const style: React.CSSProperties = { backgroundColor: color };
        if (active) {
          (style as Record<string, string>)["--tw-ring-color"] = color;
        }
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Select color ${color}`}
            className={cn(
              "grid size-7 place-items-center rounded-lg transition-transform hover:scale-110",
              active && "ring-offset-card ring-2 ring-offset-2",
            )}
            style={style}
          >
            {active && <Check className="size-4 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
