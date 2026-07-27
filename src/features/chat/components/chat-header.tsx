"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChatSearch } from "@/features/chat/hooks/use-chat-search";
import { useChatUIStore } from "@/features/chat/stores/chat-ui-store";
import { getInitials } from "@/lib/format";
import type { User } from "@/types/domain";

interface ChatHeaderProps {
  projectId: string;
  projectName: string;
  onlineCount: number;
  totalMembers: number;
  onlineUsers: User[];
}

export function ChatHeader({
  projectId,
  onlineCount,
  totalMembers,
  onlineUsers,
}: ChatHeaderProps) {
  const { searchOpen, searchQuery, setSearchOpen, setSearchQuery } =
    useChatUIStore();
  useChatSearch(projectId, searchQuery);

  return (
    <div className="border-border flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold">Chat</h2>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {onlineCount} online — {totalMembers} members
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex -space-x-1.5">
          {onlineUsers.slice(0, 5).map((u) => (
            <Tooltip key={u.id}>
              <TooltipTrigger asChild>
                <Avatar className="ring-background size-6 ring-2">
                  <AvatarFallback className="text-[9px]">
                    {getInitials(u.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{u.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {searchOpen ? (
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="h-8 w-48 rounded-xl text-xs"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 size-8 rounded-xl"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
