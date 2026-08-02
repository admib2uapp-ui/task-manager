import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Calendar,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Settings,
  Timer,
  Users,
  Orbit,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** exact match required for active state (used for index routes) */
  exact?: boolean;
  badgeKey?: "notifications";
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      { title: "Projects", href: "/projects", icon: FolderKanban },
      { title: "My Tasks", href: "/tasks", icon: ListChecks },
      { title: "Team Tasks", href: "/tasks/team", icon: Users },
      { title: "Calendar", href: "/calendar", icon: Calendar },
      { title: "Time Tracking", href: "/time-tracking", icon: Timer },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Visualize",
    items: [
      {
        title: "Orbit View",
        href: "/orbit-view",
        icon: Orbit,
        exact: true,
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      { title: "GitHub", href: "/github", icon: GitBranch },
      { title: "Documents", href: "/documents", icon: FileText },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        badgeKey: "notifications",
      },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const flatNavigation: NavItem[] = navigation.flatMap(
  (section) => section.items,
);
