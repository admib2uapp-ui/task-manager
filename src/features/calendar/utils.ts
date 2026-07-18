import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import type { Task } from "@/types/domain";

export interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
}

export const dateKey = (date: Date | string): string =>
  typeof date === "string" ? date.slice(0, 10) : format(date, "yyyy-MM-dd");

export function buildMonthGrid(month: Date): CalendarDay[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const todayKey = dateKey(new Date());

  return eachDayOfInterval({ start, end }).map((date) => ({
    date,
    key: dateKey(date),
    inMonth: date.getMonth() === month.getMonth(),
    isToday: dateKey(date) === todayKey,
  }));
}

export function groupTasksByDay(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.deadline) continue;
    const key = dateKey(task.deadline);
    const bucket = map.get(key);
    if (bucket) bucket.push(task);
    else map.set(key, [task]);
  }
  return map;
}

export const nextMonth = (d: Date) => addMonths(d, 1);
export const prevMonth = (d: Date) => subMonths(d, 1);

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
