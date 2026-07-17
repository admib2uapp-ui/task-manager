"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);

  const handleLogout = () => {
    reset();
    router.replace("/login");
  };

  const displayName = user?.name ?? "Guest";
  const displayEmail = user?.email ?? "Not signed in";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "hover:bg-sidebar-accent/60 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors",
            collapsed && "justify-center",
          )}
        >
          <Avatar className="size-8 rounded-lg">
            {user?.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-primary/15 text-primary rounded-lg text-xs font-medium">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="text-muted-foreground truncate text-xs">
                {displayEmail}
              </p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-muted-foreground text-xs">{displayEmail}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserIcon className="size-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
