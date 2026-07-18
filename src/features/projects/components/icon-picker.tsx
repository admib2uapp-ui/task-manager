"use client";

import { PROJECT_ICON_KEYS, PROJECT_ICONS } from "@/config/icons";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IconPickerProps {
  value: string;
  color: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, color, onChange }: IconPickerProps) {
  return (
    <ScrollArea className="border-border h-32 rounded-xl border p-2">
      <div className="grid grid-cols-8 gap-1.5">
        {PROJECT_ICON_KEYS.map((key) => {
          const Icon = PROJECT_ICONS[key];
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-label={`Select icon ${key}`}
              className={cn(
                "text-muted-foreground hover:bg-accent hover:text-foreground grid aspect-square place-items-center rounded-lg transition-colors",
                active && "bg-accent",
              )}
              style={active ? { color } : undefined}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
