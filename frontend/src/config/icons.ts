import {
  BookOpen,
  Bot,
  Brain,
  Bug,
  Camera,
  Cloud,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  FolderKanban,
  GitBranch,
  Globe,
  GraduationCap,
  Layers,
  type LucideIcon,
  Music,
  Palette,
  PenTool,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Target,
  Terminal,
  Zap,
} from "lucide-react";

/** Curated icon set for projects (stored by key on `project.icon`). */
export const PROJECT_ICONS: Record<string, LucideIcon> = {
  folder: FolderKanban,
  code: Code2,
  terminal: Terminal,
  cpu: Cpu,
  bot: Bot,
  brain: Brain,
  rocket: Rocket,
  flask: FlaskConical,
  book: BookOpen,
  palette: Palette,
  database: Database,
  server: Server,
  globe: Globe,
  mobile: Smartphone,
  bug: Bug,
  zap: Zap,
  target: Target,
  layers: Layers,
  cloud: Cloud,
  shield: Shield,
  git: GitBranch,
  pen: PenTool,
  camera: Camera,
  music: Music,
  education: GraduationCap,
};

export const PROJECT_ICON_KEYS = Object.keys(PROJECT_ICONS);

export function getProjectIcon(key: string | null | undefined): LucideIcon {
  return (key && PROJECT_ICONS[key]) || FolderKanban;
}
