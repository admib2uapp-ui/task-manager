import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import type { ISODateString } from "@/types/domain";

function toDate(value: ISODateString | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? date : null;
}

function toIsoDateKey(
  value: ISODateString | Date | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  const date = toDate(value);
  return date ? format(date, "yyyy-MM-dd") : null;
}

export function formatDate(
  value: ISODateString | Date | null | undefined,
  pattern = "MMM d, yyyy",
): string {
  const date = toDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatDateTime(
  value: ISODateString | Date | null | undefined,
): string {
  return formatDate(value, "MMM d, yyyy • h:mm a");
}

export function formatDeadlineDate(
  value: ISODateString | Date | null | undefined,
  pattern = "MMM d, yyyy",
): string {
  const key = toIsoDateKey(value);
  if (!key) return "—";

  const date = new Date(`${key}T00:00:00Z`);
  const options: Intl.DateTimeFormatOptions =
    pattern === "MMM d"
      ? { month: "short", day: "numeric", timeZone: "UTC" }
      : { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" };

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function isDeadlineOverdue(
  value: ISODateString | Date | null | undefined,
  now = new Date(),
): boolean {
  const key = toIsoDateKey(value);
  if (!key) return false;
  return key < now.toISOString().slice(0, 10);
}

export function formatRelative(
  value: ISODateString | Date | null | undefined,
): string {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

/** Human-readable duration from seconds, e.g. "2h 15m". */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

/** Precise HH:MM:SS clock used by the timer widget. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
