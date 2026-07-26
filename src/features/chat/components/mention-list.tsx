"use client";

import type { User } from "@/types/domain";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";

interface MentionListProps {
  users: User[];
  onSelect: (user: User) => void;
  highlightIndex: number;
}

export function MentionList({
  users,
  onSelect,
  highlightIndex,
}: MentionListProps) {
  if (users.length === 0) return null;

  return (
    <div className="bg-popover border-border shadow-soft absolute bottom-full left-0 right-0 z-50 mx-3 mb-1 max-h-40 overflow-y-auto rounded-xl border">
      {users.map((member, index) => (
        <button
          key={member.id}
          type="button"
          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
            index === highlightIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(member);
          }}
        >
          <Avatar className="size-6">
            <AvatarFallback className="text-[10px]">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <span>{member.name}</span>
        </button>
      ))}
    </div>
  );
}
