"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateTag, useTags } from "@/features/projects/hooks/use-tags";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagSelector({ selectedIds, onChange }: TagSelectorProps) {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const [newTag, setNewTag] = useState("");

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((t) => t !== id)
        : [...selectedIds, id],
    );
  }

  async function handleCreate() {
    const name = newTag.trim();
    if (!name) return;
    const created = await createTag.mutateAsync({ name });
    onChange([...selectedIds, created.id]);
    setNewTag("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreate();
            }
          }}
          placeholder="Create a tag…"
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl"
          onClick={() => void handleCreate()}
          disabled={!newTag.trim() || createTag.isPending}
          aria-label="Add tag"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="max-h-28 overflow-y-auto pr-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
                style={
                  active
                    ? { backgroundColor: tag.color }
                    : {
                        borderColor: `color-mix(in srgb, ${tag.color} 40%, transparent)`,
                      }
                }
              >
                {active && <Check className="size-3" />}
                <span
                  className="size-2 rounded-full"
                  style={active ? undefined : { backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
