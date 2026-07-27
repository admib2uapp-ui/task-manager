"use client";

import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_LIST = [
  "👍", "❤️", "😂", "🎉", "😢", "😮", "🔥", "👀",
  "🙌", "💯", "✨", "🚀", "💪", "🤔", "👏", "✅",
  "⭐", "🤝", "💡", "📌", "🎯", "🧠", "🔄", "💜",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  size?: "sm" | "md";
}

export function EmojiPicker({ onSelect, size = "md" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={size === "sm" ? "size-7 rounded-full" : "size-9 rounded-full"}
          aria-label="Pick emoji"
        >
          <SmilePlus className={size === "sm" ? "size-3.5" : "size-4"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="w-64 p-3"
      >
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="hover:bg-muted flex size-8 cursor-pointer items-center justify-center rounded-lg text-lg transition-colors"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
