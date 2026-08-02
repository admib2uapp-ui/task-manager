import type { OrbitHubType } from "@/features/orbit-view/types";

/**
 * Returns the emoji icon for a given hub type.
 */
export function getHubEmoji(type: OrbitHubType): string {
  const icons: Record<OrbitHubType, string> = {
    ideas: "💡",
    development: "⚙",
    testing: "🧪",
    review: "👀",
    completed: "✅",
  };
  return icons[type];
}

/**
 * Returns a gradient CSS string for a hub type.
 */
export function getHubGradient(type: OrbitHubType): string {
  const gradients: Record<OrbitHubType, string> = {
    ideas: "linear-gradient(135deg, #a855f7 0%, #d946ef 100%)",
    development: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
    testing: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
    review: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    completed: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  };
  return gradients[type];
}

/**
 * SVG Orbit icon component for the sidebar.
 */
export function SidebarOrbitIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M2 12c0-2.5 1.5-4.5 3-6" />
      <path d="M22 12c0-2.5-1.5-4.5-3-6" />
      <path d="M2 12c0 2.5 1.5 4.5 3 6" />
      <path d="M22 12c0 2.5-1.5 4.5-3 6" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="20" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
      <circle cx="20" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
