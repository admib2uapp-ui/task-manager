"use client";

import { useMemo, useRef, Suspense, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitHubData, OrbitIdea } from "@/features/orbit-view/types";
import type { Task } from "@/types/domain";
import type { SelectedObject } from "@/features/orbit-view/components/galaxy/card-detail-panel";

interface GalaxySceneProps {
  hubs: OrbitHubData[];
  ideas: OrbitIdea[];
  tasks: Task[];
  selectedId: string | null;
  selectedHubType: string | null;
  cameraTarget: string | null;
  onCenterClick: () => void;
  onHubClick: (hubType: string) => void;
  onObjectClick: (obj: SelectedObject) => void;
}

const HUB_COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#10b981"];

function getHubPosition(index: number, total: number, radius: number): [number, number, number] {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
}

// ─── Camera Animation ────────────────────────────────────────
function CameraAnimator({ target: _target }: { target: string | null }) {
  return <OrbitControls
    enablePan
    enableZoom
    enableRotate
    minDistance={6}
    maxDistance={60}
    dampingFactor={0.06}
    autoRotate={!_target}
    autoRotateSpeed={0.4}
  />;
}

// ─── Central Project Node ────────────────────────────────────
function CentralProjectNode({
  totalProgress,
  onClick,
  isSelected,
  isDimmed,
}: {
  totalProgress: number;
  onClick: () => void;
  isSelected: boolean;
  isDimmed: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3;
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.15;
      const t = Date.now() * 0.001;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={isDimmed ? 0.02 : 0.08} side={THREE.BackSide} />
      </mesh>
      <mesh
        ref={meshRef}
        castShadow
        onClick={onClick}
        onPointerOver={(e) => { e.object.userData.hovered = true; document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.object.userData.hovered = false; document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={isSelected ? 1.2 : isDimmed ? 0.15 : 0.6}
          roughness={0.1}
          metalness={0.7}
          transparent
          opacity={isDimmed ? 0.3 : 1}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.5, 64]} />
        <meshBasicMaterial color="#a5b4fc" side={THREE.DoubleSide} transparent opacity={isDimmed ? 0.05 : 0.25} />
      </mesh>
      <Html distanceFactor={14} position={[0, 3.2, 0]} center>
        <div className="rounded-2xl border border-indigo-500/40 bg-black/90 px-4 py-3 text-white select-none shadow-2xl min-w-[160px] text-center pointer-events-none"
          style={{ boxShadow: "0 0 30px #6366f180, 0 0 60px #6366f140" }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-sm">🌌</span>
            <span className="text-xs font-black tracking-widest uppercase text-indigo-300">Project Hub</span>
          </div>
          <div className="text-2xl font-black text-white">{Math.round(totalProgress)}%</div>
          <div className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">Overall Progress</div>
        </div>
      </Html>
    </group>
  );
}

// ─── Orbiting Card Moon ──────────────────────────────────────
function CardMoon({
  card,
  hubIndex,
  hubPosition,
  hubColor,
  totalCards,
  isSelected,
  isDimmed,
  onClick,
}: {
  card: { id: string; priority: string; };
  hubIndex: number;
  hubPosition: [number, number, number];
  hubColor: string;
  totalCards: number;
  isSelected: boolean;
  isDimmed: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = card.id.charCodeAt(card.id.length - 1) ?? 0;
  const orbitRadius = 1.3 + (hubIndex % 3) * 0.2 + Math.random() * 0.4;
  const speed = 0.3 + (hubIndex * 0.05) % 0.4;
  const size = 0.12 + (card.priority === "critical" || card.priority === "high" ? 0.1 : 0.05) + Math.random() * 0.05;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed + phase;
    const x = hubPosition[0] + Math.cos(t) * orbitRadius;
    const z = hubPosition[2] + Math.sin(t) * orbitRadius;
    meshRef.current.position.set(x, hubPosition[1] + Math.sin(t * 0.7) * 0.3, z);
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.02;
  });

  return (
    <mesh
      ref={meshRef}
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial
        color={hubColor}
        emissive={hubColor}
        emissiveIntensity={isSelected ? 1.5 : isDimmed ? 0.05 : 0.3}
        transparent
        opacity={isDimmed ? 0.2 : isSelected ? 1 : 0.7}
      />
    </mesh>
  );
}

// ─── Animated Planet ─────────────────────────────────────────
function AnimatedPlanet({
  position,
  color,
  size,
  label,
  count,
  progress,
  index,
  isSelected,
  isDimmed,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  label: string;
  count: number;
  progress: number;
  index: number;
  isSelected: boolean;
  isDimmed: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime + index * 1.2;
      meshRef.current.position.y = Math.sin(t * 0.4) * 0.4;
    }
    if (glowRef.current) {
      const t = Date.now() * 0.001 + index;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 2.5) * (isSelected ? 0.15 : 0.06));
    }
  });

  return (
    <group position={position}>
      {/* Selection glow ring */}
      {isSelected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[size + 0.8, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Glow aura */}
      <mesh>
        <sphereGeometry args={[size + 0.6, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={isDimmed ? 0.02 : 0.08} side={THREE.BackSide} />
      </mesh>

      {/* Planet body */}
      <mesh
        ref={meshRef}
        castShadow
        onClick={onClick}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.2 : isDimmed ? 0.1 : 0.4}
          roughness={0.35}
          metalness={0.3}
          transparent
          opacity={isDimmed ? 0.25 : 1}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh rotation={[Math.PI / 2 + 0.3, 0.2, 0]}>
        <ringGeometry args={[size + 0.35, size + 0.55, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={isDimmed ? 0.05 : 0.28} />
      </mesh>

      <Html distanceFactor={14} position={[0, size + 1.4, 0]} center>
        <div
          className="rounded-2xl border border-white/10 bg-black/90 px-3 py-2.5 text-white select-none shadow-2xl flex flex-col min-w-[130px] pointer-events-none"
          style={{ boxShadow: `0 0 20px ${color}50, 0 0 40px ${color}20` }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-black tracking-wide uppercase">{label}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span>Items:</span>
            <span className="font-bold text-white">{count}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-0.5">
            <span className="text-slate-400">Done:</span>
            <span className="font-bold" style={{ color }}>{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: color }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── Connection Lines ────────────────────────────────────────
function Connections({ hubPositions, hubColors, selectedId }: { hubPositions: [number, number, number][]; hubColors: string[]; selectedId: string | null }) {
  const center: [number, number, number] = [0, 0, 0];
  return (
    <>
      {hubPositions.map((pos, i) => (
        <Line key={`c-${i}`} points={[center, pos]} color={hubColors[i]} opacity={selectedId ? 0.1 : 0.35} transparent lineWidth={1.5} />
      ))}
      {hubPositions.map((pos, i) => {
        const next = hubPositions[(i + 1) % hubPositions.length];
        return <Line key={`r-${i}`} points={[pos, next]} color="#ffffff" opacity={selectedId ? 0.03 : 0.1} transparent lineWidth={0.8} />;
      })}
    </>
  );
}

// ─── GalaxyEntities ──────────────────────────────────────────
function GalaxyEntities({
  hubs,
  ideas,
  tasks,
  selectedId,
  selectedHubType,
  onHubClick,
  onObjectClick,
}: GalaxySceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !selectedId) {
      groupRef.current.rotation.y += delta * 0.025;
    }
  });

  const orbitalRadius = 10;
  const hubPositions = useMemo(() => hubs.map((_, i) => getHubPosition(i, hubs.length, orbitalRadius)), [hubs]);
  const totalProgress = useMemo(() => hubs.length ? hubs.reduce((s, h) => s + h.progress, 0) / hubs.length : 0, [hubs]);

  // Performance tier
  const totalItems = hubs.reduce((s, h) => s + h.count, 0);
  const isHighDensity = totalItems > 100;
  const isMediumDensity = totalItems > 30;

  return (
    <group ref={groupRef}>
      <Connections hubPositions={hubPositions} hubColors={HUB_COLORS.slice(0, hubs.length)} selectedId={selectedId} />

      <CentralProjectNode
        totalProgress={totalProgress}
        onClick={() => onHubClick?.("overview")}
        isSelected={selectedHubType === "overview"}
        isDimmed={!!selectedId || !!selectedHubType && selectedHubType !== "overview"}
      />

      {hubs.map((hub, i) => {
        const isHubSelected = selectedHubType === hub.type;
        const isDimmed = !!selectedId && selectedHubType !== hub.type;
        const color = HUB_COLORS[i % HUB_COLORS.length];
        const pos = hubPositions[i];

        return (
          <group key={hub.type}>
            <AnimatedPlanet
              position={pos}
              color={color}
              size={1.3 + hub.count * 0.03}
              label={hub.label}
              count={hub.count}
              progress={hub.progress}
              index={i}
              isSelected={isHubSelected}
              isDimmed={isDimmed}
              onClick={() => onHubClick?.(hub.type)}
            />

            {/* Orbiting card moons — performance tiered */}
            {hub.cards.slice(0, isHighDensity ? 5 : isMediumDensity ? 15 : 30).map((card) => {
              const isCardSelected = selectedId === card.id;
              const obj: SelectedObject = {
                type: hub.type === "ideas" ? "idea" : "task",
                id: card.id,
                hubType: hub.type,
                data: card.idea ?? (card.task as Task),
              };
              return (
                <CardMoon
                  key={card.id}
                  card={card}
                  hubIndex={i}
                  hubPosition={pos}
                  hubColor={color}
                  totalCards={hub.cards.length}
                  isSelected={isCardSelected}
                  isDimmed={!!selectedId && !isCardSelected}
                  onClick={() => onObjectClick?.(obj)}
                />
              );
            })}

            {/* Cluster node for overflow items */}
            {isHighDensity && hub.cards.length > 5 && (
              <mesh position={[pos[0], pos[1] - 1, pos[2]]}>
                <sphereGeometry args={[0.4, 12, 12]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
                <Html distanceFactor={14} center>
                  <div className="rounded-full bg-black/80 border border-white/20 px-2 py-0.5 text-[8px] text-white whitespace-nowrap pointer-events-none">
                    +{hub.cards.length - 5} items
                  </div>
                </Html>
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── Main GalaxyScene Export ─────────────────────────────────
export function GalaxyScene(props: GalaxySceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 8, 22], fov: 58, near: 0.1, far: 150 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color("#030409"))}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[10, 10, 10]} intensity={0.5} />
          <pointLight position={[0, 0, 0]} intensity={1.5} color="#6366f1" distance={20} decay={2} />
          <pointLight position={[-12, -5, -12]} intensity={0.4} color="#a855f7" />
          <Stars radius={60} depth={60} count={5000} factor={2.5} saturation={0} fade speed={0.6} />
          <GalaxyEntities {...props} />
          <CameraAnimator target={props.cameraTarget} />
        </Suspense>
      </Canvas>
    </div>
  );
}
