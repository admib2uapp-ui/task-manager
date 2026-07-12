export const siteConfig = {
  name: "Orbit",
  shortName: "Orbit",
  description:
    "A premium project management platform for engineering, research and creative work.",
  version: "0.1.0",
} as const;

export type SiteConfig = typeof siteConfig;
