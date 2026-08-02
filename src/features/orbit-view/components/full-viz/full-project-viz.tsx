"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ZoomIn, ZoomOut, Maximize2, Minimize2, 
  Hand, Search, RotateCcw 
} from "lucide-react";
import type { OrbitIdea, OrbitHubData } from "@/features/orbit-view/types";
import type { Task } from "@/types/domain";
import { cn } from "@/lib/utils";

interface NodeDetail {
  id: string;
  label: string;
  type: "idea" | "dev" | "testing" | "review" | "completed";
  status: string;
  progress?: number;
  priority?: string;
  comments?: number;
  testCases?: string;
  passing?: number;
  failing?: number;
  blocked?: number;
  assignees?: Array<{ id: string; name: string; avatarUrl: string | null }>;
}

interface FullProjectVizProps {
  ideas: OrbitIdea[];
  tasks: Task[];
  hubs: OrbitHubData[];
  onClose?: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function FullProjectViz({
  ideas,
  tasks,
  hubs,
  onClose,
  fullscreen,
  onToggleFullscreen,
}: FullProjectVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ w: 1000, h: 600 });
  const [activeTool, setActiveTool] = useState<"pan" | "select">("pan");

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ w: rect.width || 1000, h: rect.height || 600 });
    }
  }, [fullscreen]);

  // Static/Demo nodes based on the exact mockup upload structure
  const nodes: NodeDetail[] = useMemo(() => {
    return [
      {
        id: "idea-1",
        label: "AI Chat Integration",
        type: "idea",
        status: "High",
        priority: "High",
        comments: 12,
        assignees: [
          { id: "1", name: "Alex", avatarUrl: null },
          { id: "2", name: "Blake", avatarUrl: null },
          { id: "3", name: "Charlie", avatarUrl: null },
        ]
      },
      {
        id: "dev-1",
        label: "Backend API",
        type: "dev",
        status: "60%",
        progress: 60,
        testCases: "3/6",
        assignees: [
          { id: "4", name: "Dana", avatarUrl: null },
          { id: "5", name: "Evan", avatarUrl: null },
        ]
      },
      {
        id: "dev-2",
        label: "Frontend UI",
        type: "dev",
        status: "80%",
        progress: 80,
        testCases: "5/6",
        assignees: [
          { id: "6", name: "Fiona", avatarUrl: null },
          { id: "7", name: "Gabe", avatarUrl: null },
        ]
      },
      {
        id: "testing-1",
        label: "Unit Testing",
        type: "testing",
        status: "70%",
        progress: 70,
        testCases: "7/10",
        assignees: [
          { id: "8", name: "Hannah", avatarUrl: null },
        ]
      },
      {
        id: "testing-2",
        label: "Integration Testing",
        type: "testing",
        status: "50%",
        progress: 50,
        testCases: "5/10",
        assignees: [
          { id: "9", name: "Ian", avatarUrl: null },
        ]
      },
      {
        id: "review-1",
        label: "Code Review",
        type: "review",
        status: "In Review",
        comments: 2,
        assignees: [
          { id: "10", name: "Julia", avatarUrl: null },
          { id: "11", name: "Kevin", avatarUrl: null },
        ]
      },
      {
        id: "review-2",
        label: "QA Review",
        type: "review",
        status: "Changes Req.",
        comments: 3,
        assignees: [
          { id: "12", name: "Laura", avatarUrl: null },
          { id: "13", name: "Mike", avatarUrl: null },
        ]
      },
      {
        id: "done-1",
        label: "Done",
        type: "completed",
        status: "Completed",
        progress: 100,
        assignees: [
          { id: "14", name: "Nina", avatarUrl: null },
          { id: "15", name: "Oscar", avatarUrl: null },
          { id: "16", name: "Pat", avatarUrl: null },
        ]
      }
    ];
  }, []);

  // Compute node coordinates based on dimensions
  const nodeCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    const w = dimensions.w;
    const h = dimensions.h;

    // Idea (Column 1)
    coords["idea-1"] = { x: w * 0.15, y: h * 0.5 };

    // Dev (Column 2)
    coords["dev-1"] = { x: w * 0.35, y: h * 0.28 };
    coords["dev-2"] = { x: w * 0.35, y: h * 0.72 };

    // Testing (Column 3)
    coords["testing-1"] = { x: w * 0.55, y: h * 0.28 };
    coords["testing-2"] = { x: w * 0.55, y: h * 0.72 };

    // Review (Column 4)
    coords["review-1"] = { x: w * 0.75, y: h * 0.28 };
    coords["review-2"] = { x: w * 0.75, y: h * 0.72 };

    // Completed (Column 5)
    coords["done-1"] = { x: w * 0.90, y: h * 0.5 };

    return coords;
  }, [dimensions]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.0015)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === "pan" || e.button === 1 || e.target === e.currentTarget || (e.target as HTMLElement).tagName === "svg") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan, activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Render connector line
  const renderConnector = (fromId: string, toId: string, color: string) => {
    const from = nodeCoords[fromId];
    const to = nodeCoords[toId];
    if (!from || !to) return null;

    // Control points for a smooth cubic bezier curve
    const dx = Math.abs(to.x - from.x) * 0.5;
    const cp1x = from.x + dx;
    const cp1y = from.y;
    const cp2x = to.x - dx;
    const cp2y = to.y;

    return (
      <g key={`edge-${fromId}-${toId}`}>
        {/* Glow behind */}
        <path
          d={`M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`}
          stroke={color}
          strokeWidth={3}
          fill="none"
          opacity={0.4}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Main Solid Line */}
        <path
          d={`M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          opacity={0.8}
        />
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-border/40 bg-[#070913]/90 text-white shadow-2xl backdrop-blur-md",
        fullscreen ? "fixed inset-4 z-50" : "h-[650px] w-full"
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? "grabbing" : activeTool === "pan" ? "grab" : "default" }}
    >
      {/* Space background effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950/80 to-black opacity-80" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-black/40 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌌</span>
          <div>
            <h3 className="text-base font-bold tracking-wide">Full Project Visualization</h3>
            <p className="text-xs text-slate-400">Interactive project workflow dependencies</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="flex items-center justify-center rounded-xl bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              title="Toggle Fullscreen"
            >
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-xl bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              title="Close View"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas workspace */}
      <div className="relative flex-1 overflow-hidden">
        {/* SVG connection lines */}
        <svg
          width={dimensions.w}
          height={dimensions.h}
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
        >
          {/* Connector lines matching colors to destination nodes */}
          {renderConnector("idea-1", "dev-1", "#3b82f6")}
          {renderConnector("idea-1", "dev-2", "#3b82f6")}
          {renderConnector("dev-1", "testing-1", "#22c55e")}
          {renderConnector("dev-1", "testing-2", "#22c55e")}
          {renderConnector("dev-2", "testing-1", "#22c55e")}
          {renderConnector("dev-2", "testing-2", "#22c55e")}
          {renderConnector("testing-1", "review-1", "#f59e0b")}
          {renderConnector("testing-2", "review-2", "#f59e0b")}
          {renderConnector("review-1", "done-1", "#06b6d4")}
          {renderConnector("review-2", "done-1", "#06b6d4")}
        </svg>

        {/* Floating HTML nodes */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
        >
          {nodes.map((node) => {
            const coord = nodeCoords[node.id];
            if (!coord) return null;

            // Compute border and shadow based on node type
            let cardStyle = "border-slate-800 bg-[#0e1329]/80 shadow-slate-950/50";
            let tagColor = "bg-slate-500/20 text-slate-300";
            let glowFilter = "drop-shadow(0 0 10px rgba(30, 41, 59, 0.4))";

            if (node.type === "idea") {
              cardStyle = "border-amber-500/60 bg-[#1a1712]/95 shadow-amber-950/20 hover:border-amber-400";
              tagColor = "bg-amber-500/20 text-amber-400";
              glowFilter = "drop-shadow(0 0 15px rgba(245, 158, 11, 0.25))";
            } else if (node.type === "dev") {
              cardStyle = "border-blue-500/60 bg-[#0d172e]/95 shadow-blue-950/20 hover:border-blue-400";
              tagColor = "bg-blue-500/20 text-blue-400";
              glowFilter = "drop-shadow(0 0 15px rgba(59, 130, 246, 0.25))";
            } else if (node.type === "testing") {
              cardStyle = "border-emerald-500/60 bg-[#0c1c1c]/95 shadow-emerald-950/20 hover:border-emerald-400";
              tagColor = "bg-emerald-500/20 text-emerald-400";
              glowFilter = "drop-shadow(0 0 15px rgba(16, 185, 129, 0.25))";
            } else if (node.type === "review") {
              cardStyle = "border-purple-500/60 bg-[#16122b]/95 shadow-purple-950/20 hover:border-purple-400";
              tagColor = "bg-purple-500/20 text-purple-400";
              glowFilter = "drop-shadow(0 0 15px rgba(168, 85, 247, 0.25))";
            } else if (node.type === "completed") {
              cardStyle = "border-cyan-500/60 bg-[#091e2b]/95 shadow-cyan-950/20 hover:border-cyan-400";
              tagColor = "bg-cyan-500/20 text-cyan-400";
              glowFilter = "drop-shadow(0 0 15px rgba(6, 182, 212, 0.25))";
            }

            return (
              <motion.div
                key={node.id}
                className={cn(
                  "absolute z-20 flex w-52 flex-col rounded-2xl border p-4 backdrop-blur-md transition-all shadow-lg cursor-pointer",
                  cardStyle
                )}
                style={{
                  left: coord.x - 104, // half of width
                  top: coord.y - 65,  // approx half of height
                  filter: glowFilter,
                }}
                whileHover={{ scale: 1.04, y: coord.y - 68 }}
                onClick={() => setSelectedNode(node)}
              >
                {/* Node Label */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{node.label}</h4>
                  {node.comments !== undefined && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      💬 {node.comments}
                    </span>
                  )}
                </div>

                {/* Status Badges */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase", tagColor)}>
                    {node.status}
                  </span>
                  {node.testCases && (
                    <span className="text-[10px] text-slate-400">
                      📋 {node.testCases}
                    </span>
                  )}
                </div>

                {/* Progress bar (if applicable) */}
                {node.progress !== undefined && (
                  <div className="mt-3 w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        node.type === "completed" ? "bg-cyan-500" :
                        node.type === "testing" ? "bg-emerald-500" : "bg-blue-500"
                      )}
                      style={{ width: `${node.progress}%` }}
                    />
                  </div>
                )}

                {/* Assignees Avatars */}
                {node.assignees && node.assignees.length > 0 && (
                  <div className="mt-3 flex items-center -space-x-1.5 overflow-hidden">
                    {node.assignees.map((user) => (
                      <div
                        key={user.id}
                        className="inline-block size-5 rounded-full border border-slate-900 bg-indigo-600 text-[8px] font-bold flex items-center justify-center text-white"
                        title={user.name}
                      >
                        {user.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating Toolbar (Left side) */}
      <div className="absolute left-6 top-24 z-30 flex flex-col gap-2 rounded-2xl border border-white/5 bg-black/60 p-1.5 backdrop-blur-md">
        <button
          onClick={() => setActiveTool("pan")}
          className={cn(
            "flex size-10 items-center justify-center rounded-xl transition-colors",
            activeTool === "pan" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
          title="Pan Mode"
        >
          <Hand className="size-4" />
        </button>
        <button
          onClick={() => setActiveTool("select")}
          className={cn(
            "flex size-10 items-center justify-center rounded-xl transition-colors",
            activeTool === "select" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
          title="Selection Mode"
        >
          <Search className="size-4" />
        </button>
        <div className="h-px bg-white/5 mx-2" />
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="size-4" />
        </button>
      </div>

      {/* Zoom indicator & Reset (Bottom left) */}
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 rounded-xl border border-white/5 bg-black/60 px-3 py-1.5 backdrop-blur-md">
        <span className="text-[10px] font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
        <div className="w-px h-3 bg-white/10" />
        <button
          onClick={resetView}
          className="text-[10px] font-bold text-slate-300 transition hover:text-white flex items-center gap-1"
        >
          <RotateCcw className="size-3" /> Fit View
        </button>
      </div>

      {/* Mini-map view (Bottom right) */}
      <div className="absolute bottom-6 right-6 z-30 overflow-hidden rounded-xl border border-white/5 bg-black/60 p-2 backdrop-blur-md hidden sm:block">
        <div className="relative w-36 h-20 bg-slate-950/40 rounded-lg">
          {nodes.map((node) => {
            const coord = nodeCoords[node.id];
            if (!coord) return null;

            let color = "bg-slate-500";
            if (node.type === "idea") color = "bg-amber-500";
            else if (node.type === "dev") color = "bg-blue-500";
            else if (node.type === "testing") color = "bg-emerald-500";
            else if (node.type === "review") color = "bg-purple-500";
            else if (node.type === "completed") color = "bg-cyan-500";

            return (
              <div
                key={`mini-${node.id}`}
                className={cn("absolute size-1.5 rounded-full", color)}
                style={{
                  left: `${(coord.x / dimensions.w) * 100}%`,
                  top: `${(coord.y / dimensions.h) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Drawer Panel for selected node details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute right-0 top-18 bottom-0 z-40 w-80 border-l border-white/5 bg-[#090b16]/98 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                {selectedNode.type} Details
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <h4 className="mt-4 text-lg font-bold text-white leading-tight">{selectedNode.label}</h4>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Status</span>
                <span className="inline-block rounded-full bg-slate-900 border border-slate-700/60 px-3 py-1 text-xs font-semibold">
                  {selectedNode.status}
                </span>
              </div>

              {selectedNode.progress !== undefined && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Progress</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${selectedNode.progress}%` }} />
                    </div>
                    <span className="text-xs font-bold font-mono">{selectedNode.progress}%</span>
                  </div>
                </div>
              )}

              {selectedNode.testCases && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Test Status</span>
                  <p className="text-xs font-semibold text-slate-200">
                    {selectedNode.testCases} total passing tests
                  </p>
                </div>
              )}

              {selectedNode.assignees && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-2">Team Assigned</span>
                  <div className="space-y-2">
                    {selectedNode.assignees.map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-200">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
