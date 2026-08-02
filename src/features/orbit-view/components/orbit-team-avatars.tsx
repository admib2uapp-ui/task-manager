"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";
import type { User } from "@/types/domain";

interface TeamMember extends User {
  isOnline?: boolean;
  unreadCount?: number;
  isInMeeting?: boolean;
}

interface OrbitTeamAvatarsProps {
  members: TeamMember[];
  max?: number;
  size?: "sm" | "md" | "lg";
  showPresence?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: "size-6 sm:size-7",
  md: "size-8 sm:size-9",
  lg: "size-10 sm:size-11",
};

const FONT_MAP = {
  sm: "text-[8px] sm:text-[9px]",
  md: "text-[10px] sm:text-xs",
  lg: "text-xs sm:text-sm",
};

export function OrbitTeamAvatars({
  members,
  max = 5,
  size = "md",
  showPresence = true,
  className,
}: OrbitTeamAvatarsProps) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visible.map((member) => (
        <div key={member.id} className="relative">
          <Avatar
            className={cn(
              "border-2 border-background ring-1 ring-border transition-transform hover:scale-110 hover:z-10",
              SIZE_MAP[size],
            )}
          >
            <AvatarImage src={member.avatarUrl ?? undefined} />
            <AvatarFallback className={cn(FONT_MAP[size], "font-medium")}>
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>

          {/* Presence indicators */}
          {showPresence && (
            <>
              {member.isOnline && (
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background bg-success",
                    size === "sm" ? "size-2" : "size-2.5 sm:size-3",
                  )}
                />
              )}
              {member.unreadCount && member.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-danger text-[7px] font-bold text-white sm:size-4 sm:text-[8px]">
                  {member.unreadCount > 9 ? "9+" : member.unreadCount}
                </span>
              )}
              {member.isInMeeting && (
                <span className="absolute -top-1 -left-1 text-[8px]">🎙</span>
              )}
            </>
          )}
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={cn(
            "bg-muted flex items-center justify-center rounded-full border-2 border-background text-[9px] font-medium text-muted-foreground sm:text-[10px]",
            SIZE_MAP[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
