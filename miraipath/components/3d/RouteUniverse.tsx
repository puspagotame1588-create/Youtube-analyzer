"use client";

/**
 * The interactive 3D "Future Route Universe" scene.
 *
 * Student node (left) → institution nodes (universities blue, vocational
 * teal) → career nodes (right). Animated particles travel in BOTH directions:
 * student→institution packets represent the profile (Japanese level, budget,
 * field…), institution→student packets represent program facts (requirements,
 * tuition, deadlines…). Path brightness reflects the real route-fit score of
 * the seeded demo profile; amber warning nodes mark missing requirements.
 *
 * Rendering is intentionally lightweight: low-poly spheres, drei Line,
 * a handful of Html labels, no textures, dpr capped by the parent Canvas.
 */
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import {
  buildHeroPaths,
  HERO_INSTITUTION_STUDENTS,
  STUDENT_POS,
  type HeroControls,
  type HeroPath,
} from "@/components/3d/sceneGraph";

export type HeroMode = "student" | "institution";

export interface HeroSelection {
  path: HeroPath;
}

interface SceneProps {
  controls: HeroControls;
  mode: HeroMode;
  selectedId: string | null;
  onSelect: (path: HeroPath | null) => void;
  animate: boolean;
}

function curveBetween(a: THREE.Vector3, b: THREE.Vector3, lift = 0.6) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y += lift;
  mid.z += 0.3;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

function GlowSphere({
  position,
  color,
  size = 0.16,
  emissiveIntensity = 1.6,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  position: THREE.Vector3 | [number, number, number];
  color: string;
  size?: number;
  emissiveIntensity?: number;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}) {
  return (
    <mesh
      position={position instanceof THREE.Vector3 ? position : new THREE.Vector3(...position)}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onPointerOver ? (e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; onPointerOver(); } : undefined}
      onPointerOut={onPointerOut ? () => { document.body.style.cursor = "auto"; onPointerOut(); } : undefined}
    >
      <sphereGeometry args={[size, 20, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.35}
      />
    </mesh>
  );
}

function FlowParticles({
  curve,
  color,
  count,
  speed,
  reverse,
  dimmed,
  animate,
}: {
  curve: THREE.QuadraticBezierCurve3;
  color: string;
  count: number;
  speed: number;
  reverse: boolean;
  dimmed: boolean;
  animate: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const offsets = useMemo(
    () => Array.from({ length: count }, (_, i) => i / count),
    [count]
  );

  useFrame(({ clock }) => {
    if (!group.current || !animate) return;
    const time = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      let u = (offsets[i] + time * speed) % 1;
      if (reverse) u = 1 - u;
      const p = curve.getPoint(u);
      child.position.copy(p);
    });
  });

  return (
    <group ref={group}>
      {offsets.map((o, i) => (
        <mesh key={i} position={curve.getPoint(reverse ? 1 - o : o)}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={dimmed ? 0.12 : 0.9} />
        </mesh>
      ))}
    </group>
  );
}

function RoutePath({
  path,
  hovered,
  anySelected,
  selected,
  onSelect,
  onHover,
  animate,
  showLabels,
}: {
  path: HeroPath;
  hovered: boolean;
  anySelected: boolean;
  selected: boolean;
  onSelect: () => void;
  onHover: (over: boolean) => void;
  animate: boolean;
  showLabels: boolean;
}) {
  const student = useMemo(() => new THREE.Vector3(...path.studentPos), [path.studentPos]);
  const inst = useMemo(() => new THREE.Vector3(...path.institutionPos), [path.institutionPos]);
  const career = useMemo(() => new THREE.Vector3(...path.careerPos), [path.careerPos]);

  const curveA = useMemo(() => curveBetween(student, inst, 0.55), [student, inst]);
  const curveB = useMemo(() => curveBetween(inst, career, 0.25), [inst, career]);
  const pointsA = useMemo(() => curveA.getPoints(36), [curveA]);
  const pointsB = useMemo(() => curveB.getPoints(28), [curveB]);

  const score = path.match.score;
  const active = hovered || selected;
  const dimmed = anySelected && !active;
  // Brightness is driven by the real route-fit score.
  const baseOpacity = 0.25 + (score / 100) * 0.6;
  const opacity = dimmed ? 0.08 : active ? 1 : baseOpacity;
  const lineWidth = active ? 2.6 : 1.2 + (score / 100) * 1.2;
  const hasWarning = path.match.missingRequirements.length > 0;
  const warnPos = useMemo(() => curveA.getPoint(0.55), [curveA]);

  return (
    <group>
      <Line points={pointsA} color={path.color} transparent opacity={opacity} lineWidth={lineWidth} />
      <Line points={pointsB} color={path.color} transparent opacity={opacity * 0.75} lineWidth={lineWidth * 0.8} dashed dashSize={0.12} gapSize={0.08} />

      {/* profile data flowing to the institution */}
      <FlowParticles curve={curveA} color="#9ed4ff" count={3} speed={0.11} reverse={false} dimmed={dimmed} animate={animate} />
      {/* program facts flowing back to the student */}
      <FlowParticles curve={curveA} color="#ffd58a" count={2} speed={0.08} reverse dimmed={dimmed} animate={animate} />
      {/* graduates flowing toward careers */}
      <FlowParticles curve={curveB} color={path.color} count={2} speed={0.07} reverse={false} dimmed={dimmed} animate={animate} />

      {/* Institution node */}
      <GlowSphere
        position={inst}
        color={path.color}
        size={path.isUniversity ? 0.22 : 0.19}
        emissiveIntensity={dimmed ? 0.4 : 1.8}
        onClick={onSelect}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      />
      {/* orbit ring distinguishes universities */}
      {path.isUniversity && (
        <mesh position={inst} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.34, 0.012, 8, 40]} />
          <meshBasicMaterial color={path.color} transparent opacity={dimmed ? 0.1 : 0.6} />
        </mesh>
      )}

      {/* Career node */}
      <GlowSphere position={career} color="#c4b5fd" size={0.11} emissiveIntensity={dimmed ? 0.3 : 1.2} />

      {/* Missing-requirement warning node (amber) */}
      {hasWarning && !dimmed && (
        <GlowSphere position={warnPos} color="#f59e0b" size={0.07} emissiveIntensity={2} />
      )}

      {showLabels && !dimmed && (
        <Html position={[inst.x, inst.y + 0.42, inst.z]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-md border border-white/20 bg-[#0b1533]/80 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            {path.institutionShortLabel}
            <span className="ml-1.5 text-white/50">fit {score}</span>
          </div>
        </Html>
      )}
      {showLabels && !dimmed && (
        <Html position={[career.x, career.y + 0.3, career.z]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-md bg-[#0b1533]/60 px-1.5 py-0.5 text-[9px] text-violet-200/80">
            {path.careerLabel}
          </div>
        </Html>
      )}
    </group>
  );
}

function InstitutionViewStudents({ focus, animate }: { focus: THREE.Vector3; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current && animate) {
      group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.08;
    }
  });
  return (
    <group ref={group} position={focus}>
      {HERO_INSTITUTION_STUDENTS.map((s, i) => {
        const angle = (i / HERO_INSTITUTION_STUDENTS.length) * Math.PI * 2;
        const pos: [number, number, number] = [
          Math.cos(angle) * 1.5,
          Math.sin(angle) * 1.1,
          Math.sin(angle * 2) * 0.4,
        ];
        const color = s.consented ? "#34d399" : "#64748b";
        return (
          <group key={s.id}>
            <Line
              points={[[0, 0, 0], pos]}
              color={color}
              transparent
              opacity={s.consented ? 0.7 : 0.25}
              lineWidth={s.consented ? 1.6 : 1}
              dashed={!s.consented}
              dashSize={0.08}
              gapSize={0.06}
            />
            <GlowSphere position={pos} color={color} size={0.1} emissiveIntensity={s.consented ? 1.6 : 0.6} />
            <Html position={[pos[0], pos[1] + 0.25, pos[2]]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
              <div className="whitespace-nowrap rounded-md bg-[#0b1533]/85 px-1.5 py-0.5 text-[9px] text-white/85">
                {s.id} · {s.label} ·{" "}
                <span className={s.consented ? "text-emerald-300" : "text-slate-400"}>
                  {s.consented ? "consented" : "no consent"}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function BackgroundStars() {
  const positions = useMemo(() => {
    const arr = new Float32Array(220 * 3);
    // deterministic pseudo-random star field
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647) * 2 - 1;
    };
    for (let i = 0; i < 220; i++) {
      arr[i * 3] = rand() * 14;
      arr[i * 3 + 1] = rand() * 8;
      arr[i * 3 + 2] = -3 - Math.abs(rand()) * 6;
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#8fb8ff" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function CameraRig({ mode, animate }: { mode: HeroMode; animate: boolean }) {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const wobbleX = animate ? Math.sin(t * 0.12) * 0.35 : 0;
    const wobbleY = animate ? Math.cos(t * 0.1) * 0.2 : 0;
    if (mode === "student") {
      target.set(0.4 + pointer.x * 0.5 + wobbleX, 0.15 + pointer.y * 0.35 + wobbleY, 8.9);
    } else {
      // move toward the university cluster in institution view
      target.set(2.2 + pointer.x * 0.3, 1.2 + pointer.y * 0.25, 4.6);
    }
    camera.position.lerp(target, 0.035);
    camera.lookAt(mode === "student" ? 0.4 : 1.8, mode === "student" ? 0 : 1.1, 0);
  });
  return null;
}

function Scene({ controls, mode, selectedId, onSelect, animate }: SceneProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const paths = useMemo(() => buildHeroPaths(controls), [controls]);
  const rotGroup = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (rotGroup.current && animate && mode === "student") {
      rotGroup.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.05) * 0.1;
    }
  });

  const anyActive = Boolean(hoveredId || selectedId);
  const focusPath = paths.find((p) => p.isUniversity) ?? paths[0];

  return (
    <>
      <color attach="background" args={["#050a1c"]} />
      <fog attach="fog" args={["#050a1c", 9, 18]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[-4, 2, 4]} intensity={40} color="#5b9dff" />
      <pointLight position={[4, -2, 4]} intensity={30} color="#2dd4bf" />

      <BackgroundStars />

      <group ref={rotGroup} onPointerMissed={() => onSelect(null)}>
        {/* Central student node */}
        <GlowSphere position={STUDENT_POS} color="#7dd3fc" size={0.3} emissiveIntensity={2.2} />
        <mesh position={STUDENT_POS}>
          <sphereGeometry args={[0.45, 20, 20]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.12} />
        </mesh>
        <Html position={[STUDENT_POS[0], STUDENT_POS[1] - 0.75, STUDENT_POS[2]]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-md border border-cyan-300/30 bg-[#0b1533]/85 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
            {mode === "student" ? "You · International student" : "Anonymized student pool"}
          </div>
        </Html>

        {mode === "student" ? (
          paths.map((path) => (
            <RoutePath
              key={path.program.id}
              path={path}
              hovered={hoveredId === path.program.id}
              selected={selectedId === path.program.id}
              anySelected={anyActive}
              onSelect={() => onSelect(path)}
              onHover={(over) => setHoveredId(over ? path.program.id : null)}
              animate={animate}
              showLabels
            />
          ))
        ) : (
          <>
            {/* Institution view: focus one university node and its candidate pool */}
            <GlowSphere
              position={focusPath.institutionPos}
              color={focusPath.color}
              size={0.3}
              emissiveIntensity={2.2}
            />
            <Html
              position={[focusPath.institutionPos[0], focusPath.institutionPos[1] + 0.55, focusPath.institutionPos[2]]}
              center
              distanceFactor={8}
              style={{ pointerEvents: "none" }}
            >
              <div className="whitespace-nowrap rounded-md border border-blue-300/30 bg-[#0b1533]/85 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
                {focusPath.institutionShortLabel} — matched candidates
              </div>
            </Html>
            <InstitutionViewStudents
              focus={new THREE.Vector3(...focusPath.institutionPos)}
              animate={animate}
            />
          </>
        )}
      </group>

      <CameraRig mode={mode} animate={animate} />
    </>
  );
}

export default function RouteUniverse(props: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0.4, 0.15, 8.9], fov: 46 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      style={{ touchAction: "pan-y" }}
      aria-hidden
    >
      <Scene {...props} />
    </Canvas>
  );
}
