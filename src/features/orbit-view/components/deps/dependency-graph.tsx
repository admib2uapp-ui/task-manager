"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { DepGraphNode } from "@/features/orbit-view/components/deps/dep-graph-node";
import type { OrbitIdea, OrbitHubData } from "@/features/orbit-view/types";
import type { Task } from "@/types/domain";
import { cn } from "@/lib/utils";

interface GraphNode {
  id: string;
  label: string;
  type: "idea" | "task" | "bug" | "testing" | "review" | "milestone";
  status: string;
  x: number;
  y: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "blocked_by" | "depends_on" | "related" | "parent" | "child";
}

interface DependencyGraphProps {
  ideas: OrbitIdea[];
  tasks: Task[];
  hubs: OrbitHubData[];
  onClose?: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const EDGE_COLORS: Record<string, string> = {
  blocked_by: "#ef4444",
  depends_on: "#f59e0b",
  related: "#3b82f6",
  parent: "#a855f7",
  child: "#22c55e",
};

export function DependencyGraph({
  ideas,
  tasks,
  hubs,
  onClose,
  fullscreen,
  onToggleFullscreen,
}: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ w: 700, h: 500 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ w: rect.width, h: rect.height });
    }
  }, [fullscreen]);

  const { nodes, edges } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const cx = dimensions.w / 2;
    const cy = dimensions.h / 2;
    const spread = Math.min(dimensions.w, dimensions.h) * 0.35;

    // Ideas on the left
    ideas.slice(0, 8).forEach((idea, i) => {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: idea.id,
        label: idea.title,
        type: "idea",
        status: idea.status,
        x: cx - spread * 1.2 + Math.cos(angle) * 60,
        y: cy + Math.sin(angle) * 80,
      });
    });

    // Tasks arranged in a circle
    const activeTasks = tasks.filter(
      (t) => t.status !== "done" && t.status !== "backlog",
    );
    activeTasks.slice(0, 16).forEach((task, i) => {
      const angle = (i / Math.max(activeTasks.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const r = spread * 0.9;
      const nodeType =
        task.status === "review"
          ? "review"
          : task.status === "in_progress"
            ? "task"
            : "task";
      nodes.push({
        id: task.id,
        label: task.title,
        type: nodeType,
        status: task.status,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    });

    // Create edges from task dependencies
    tasks.forEach((task) => {
      if (task.dependencyIds) {
        task.dependencyIds.forEach((depId) => {
          if (nodes.some((n) => n.id === depId)) {
            edges.push({
              source: depId,
              target: task.id,
              type: "depends_on",
            });
          }
        });
      }
    });

    // Link ideas to their related tasks
    ideas.forEach((idea) => {
      if (idea.relatedTaskIds) {
        idea.relatedTaskIds.forEach((taskId) => {
          if (nodes.some((n) => n.id === taskId)) {
            edges.push({
              source: idea.id,
              target: taskId,
              type: "related",
            });
          }
        });
      }
    });

    return { nodes, edges };
  }, [ideas, tasks, dimensions]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "svg") {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    },
    [isPanning, panStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <div
      className={cn(
        "orbit-card-glass relative flex flex-col overflow-hidden rounded-2xl border",
        fullscreen ? "fixed inset-4 z-50" : "h-[500px] w-full",
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
        <h3 className="text-xs font-semibold sm:text-sm">Dependency Graph</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <span className="text-muted-foreground w-8 text-center text-[10px] font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <div className="bg-border/30 mx-1 h-4 w-px" />
          <button
            onClick={onToggleFullscreen}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
            aria-label={fullscreen ? "Minimize" : "Maximize"}
          >
            {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
              aria-label="Close"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Graph canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        <svg
          width={dimensions.w}
          height={dimensions.h}
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.source);
            const to = nodes.find((n) => n.id === edge.target);
            if (!from || !to) return null;

            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const curvature = Math.min(Math.abs(dx), 60);
            const cpx = midX;
            const cpy = midY - curvature - 30;

            const isHighlighted =
              highlightedNode === edge.source || highlightedNode === edge.target;
            const color = EDGE_COLORS[edge.type] ?? "#71717a";

            return (
              <g key={`edge-${i}`}>
                {/* Shadow line */}
                <path
                  d={`M ${from.x} ${from.y} Q ${cpx} ${cpy}, ${to.x} ${to.y}`}
                  stroke={color}
                  strokeWidth={isHighlighted ? 4 : 2}
                  fill="none"
                  strokeLinecap="round"
                  opacity={isHighlighted ? 0.8 : 0.25}
                  style={{
                    filter: isHighlighted ? `drop-shadow(0 0 6px ${color})` : undefined,
                    transition: "opacity 0.2s",
                  }}
                />
                {/* Animated flow line */}
                <path
                  d={`M ${from.x} ${from.y} Q ${cpx} ${cpy}, ${to.x} ${to.y}`}
                  stroke={color}
                  strokeWidth={1}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                  opacity={isHighlighted ? 0.9 : 0.4}
                  className="orbit-flow-line"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <DepGraphNode
              key={node.id}
              {...node}
              isHighlighted={highlightedNode === node.id}
              onClick={() => setSelectedNode(node)}
              onHover={setHighlightedNode}
            />
          ))}
        </svg>

        {/* Minimap */}
        {fullscreen && (
          <div className="absolute right-3 bottom-3 rounded-xl border border-border/50 bg-background/80 p-1.5 backdrop-blur-xl">
            <svg width={120} height={80} className="rounded-lg">
              <rect width={120} height={80} fill="var(--muted)" rx={4} />
              {nodes.map((node) => (
                <circle
                  key={node.id}
                  cx={(node.x / dimensions.w) * 120}
                  cy={(node.y / dimensions.h) * 80}
                  r={2}
                  fill="#3b82f6"
                  opacity={0.6}
                />
              ))}
              <rect
                x={(-pan.x / (zoom * dimensions.w)) * 120 + 60 - 60 / zoom}
                y={(-pan.y / (zoom * dimensions.h)) * 80 + 40 - 40 / zoom}
                width={120 / zoom}
                height={80 / zoom}
                fill="none"
                stroke="var(--foreground)"
                strokeWidth={1}
                rx={2}
                opacity={0.5}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Selected node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            className="absolute right-3 top-14 max-w-[220px] rounded-xl border border-border/50 bg-background/90 p-3 backdrop-blur-xl"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
            <p className="mt-1 text-xs font-medium leading-snug">{selectedNode.label}</p>
            <span
              className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[selectedNode.status] ?? "#71717a"} 16%, transparent)`,
                color: STATUS_COLORS[selectedNode.status] ?? "#71717a",
              }}
            >
              {selectedNode.status}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "#71717a",
  todo: "#a1a1aa",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#22c55e",
  approved: "#22c55e",
  blocked: "#ef4444",
  draft: "#71717a",
  submitted: "#3b82f6",
};
