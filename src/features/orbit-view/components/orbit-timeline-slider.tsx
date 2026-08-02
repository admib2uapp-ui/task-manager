"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrbitDate } from "@/features/orbit-view/lib/utils";

interface TimelineEvent {
  id: string;
  date: string;
  type:
    | "idea_created"
    | "task_created"
    | "dev_started"
    | "testing_started"
    | "review_started"
    | "completed"
    | "member_joined"
    | "member_removed"
    | "comment"
    | "attachment"
    | "ai_action";
  title: string;
  description?: string;
  user?: string;
}

interface OrbitTimelineSliderProps {
  events: TimelineEvent[];
  className?: string;
}

const EVENT_ICONS: Record<string, string> = {
  idea_created: "💡",
  task_created: "📋",
  dev_started: "⚙",
  testing_started: "🧪",
  review_started: "👀",
  completed: "✅",
  member_joined: "👤",
  member_removed: "🚫",
  comment: "💬",
  attachment: "📎",
  ai_action: "🤖",
};

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    idea_created: "#a855f7",
    task_created: "#3b82f6",
    dev_started: "#3b82f6",
    testing_started: "#22c55e",
    review_started: "#f59e0b",
    completed: "#22c55e",
    member_joined: "#06b6d4",
    member_removed: "#ef4444",
    comment: "#8b5cf6",
    attachment: "#f97316",
    ai_action: "#ec4899",
  };
  return colors[type] ?? "#71717a";
}

export function OrbitTimelineSlider({
  events,
  className,
}: OrbitTimelineSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const currentEvent = sorted[currentIndex];
  const progress = sorted.length > 1 ? currentIndex / (sorted.length - 1) : 0;

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, sorted.length - 1)));
  }, [sorted.length]);

  const stepForward = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const stepBackward = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const cycleSpeed = useCallback(() => {
    setSpeed((s) => (s >= 4 ? 0.5 : s * 2));
  }, []);

  useEffect(() => {
    if (isPlaying && sorted.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= sorted.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, sorted.length]);

  if (sorted.length === 0) {
    return (
      <div className={cn("orbit-card-glass rounded-2xl border p-4 text-center", className)}>
        <p className="text-muted-foreground text-xs">No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className={cn("orbit-card-glass rounded-2xl border", className)}>
      {/* Controls */}
      <div className="flex items-center gap-1 border-b border-border/50 px-3 py-2">
        <button
          onClick={stepBackward}
          disabled={currentIndex === 0}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors disabled:opacity-30"
          aria-label="Previous event"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <button
          onClick={isPlaying ? pause : play}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>

        <button
          onClick={stepForward}
          disabled={currentIndex >= sorted.length - 1}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors disabled:opacity-30"
          aria-label="Next event"
        >
          <ChevronRight className="size-3.5" />
        </button>

        <div className="bg-border/30 mx-1 h-4 w-px" />

        <button
          onClick={cycleSpeed}
          className="text-muted-foreground hover:text-foreground min-w-[32px] rounded-lg px-1.5 py-0.5 text-[10px] font-medium transition-colors"
        >
          {speed}x
        </button>

        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <SkipBack className="size-3" />
          <span>
            {currentIndex + 1} / {sorted.length}
          </span>
          <SkipForward className="size-3" />
        </div>
      </div>

      {/* Timeline track */}
      <div className="px-3 py-4">
        <div
          ref={trackRef}
          className="relative h-8 cursor-pointer"
          onClick={(e) => {
            if (trackRef.current) {
              const rect = trackRef.current.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              goTo(Math.round(pct * (sorted.length - 1)));
            }
          }}
        >
          {/* Base line */}
          <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rounded-full bg-border/50" />

          {/* Progress line */}
          <motion.div
            className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 rounded-full"
            style={{
              background: "linear-gradient(90deg, #3b82f6, #22c55e)",
              width: `${progress * 100}%`,
            }}
            layout
          />

          {/* Event dots */}
          {sorted.map((event, i) => {
            const pos = sorted.length > 1 ? i / (sorted.length - 1) : 0.5;
            const isActive = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div
                key={event.id}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all"
                style={{ left: `${pos * 100}%`, zIndex: isCurrent ? 10 : 1 }}
              >
                <div
                  className={cn(
                    "rounded-full border-2 transition-all",
                    isCurrent
                      ? "size-4 border-background shadow-glow"
                      : isActive
                        ? "size-2.5 border-primary"
                        : "size-2 border-border/30",
                  )}
                  style={{
                    backgroundColor: isCurrent
                      ? getEventColor(event.type)
                      : isActive
                        ? "var(--primary)"
                        : "var(--muted)",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Current event detail */}
        <AnimatedEventCard event={currentEvent} />
      </div>
    </div>
  );
}

function AnimatedEventCard({ event }: { event: TimelineEvent }) {
  return (
    <motion.div
      key={event.id}
      className="mt-3 rounded-xl border border-border/30 bg-muted/30 p-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-lg">{EVENT_ICONS[event.type] ?? "📌"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${getEventColor(event.type)} 16%, transparent)`,
                color: getEventColor(event.type),
              }}
            >
              {event.type.replace(/_/g, " ")}
            </span>
            <span className="text-muted-foreground text-[10px]">
              {formatOrbitDate(event.date)}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium leading-snug">{event.title}</p>
          {event.description && (
            <p className="text-muted-foreground mt-0.5 text-[10px] leading-relaxed">
              {event.description}
            </p>
          )}
          {event.user && (
            <p className="text-muted-foreground mt-0.5 text-[9px]">by {event.user}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
