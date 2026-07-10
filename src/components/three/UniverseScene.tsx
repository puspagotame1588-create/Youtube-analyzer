'use client';

/**
 * Parallel Futures Universe — each simulated route is an explorable light
 * ribbon growing from the shared "Now" beacon. When assumptions change, the
 * affected ribbons regrow (branch animation) and the UI explains why.
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { SimRoute } from '@/lib/simulation/types';
import { useQuality } from '@/lib/store/quality';

export const ROUTE_COLORS: Record<string, string> = {
  university: '#00B8D9',
  vocational: '#8B5CF6',
  employment: '#10B981',
};

const MAX_MONTHS = 110;

/** Months → forward distance, sqrt-compressed so the far future stays in view. */
function monthZ(month: number): number {
  return 3 - Math.sqrt(Math.min(month, MAX_MONTHS)) * 1.9;
}

function routeCurve(route: SimRoute, laneX: number): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [new THREE.Vector3(0, 0.4, 3)];
  route.milestones.forEach((m, i) => {
    const z = monthZ(m.monthOffset) - i * 0.12;
    const x = laneX * Math.min(1, (i + 1) / 3); // fan out over the first milestones
    const y = 0.5 + i * 0.09;
    pts.push(new THREE.Vector3(x, y, z));
  });
  return new THREE.CatmullRomCurve3(pts);
}

function milestonePositions(route: SimRoute, curve: THREE.CatmullRomCurve3): THREE.Vector3[] {
  const n = route.milestones.length;
  return route.milestones.map((_, i) => curve.getPoint((i + 1) / n));
}

function RouteRibbon({
  route,
  laneX,
  selected,
  dimmed,
  reducedMotion,
  onSelectMilestone,
  selectedMilestoneId,
  displayName,
}: {
  route: SimRoute;
  laneX: number;
  selected: boolean;
  dimmed: boolean;
  reducedMotion: boolean;
  onSelectMilestone: (routeId: string, milestoneId: string) => void;
  selectedMilestoneId: string | null;
  displayName: string;
}): React.JSX.Element {
  const color = ROUTE_COLORS[route.kind] ?? '#00B8D9';
  const curve = useMemo(() => routeCurve(route, laneX), [route, laneX]);
  const positions = useMemo(() => milestonePositions(route, curve), [route, curve]);
  const tubeRef = useRef<THREE.Mesh>(null);
  const progress = useRef(reducedMotion ? 1 : 0);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // Growth animation (interruptible; instant under reduced motion)
    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 0.6);
      const geo = tubeRef.current?.geometry;
      if (geo?.index) {
        geo.setDrawRange(0, Math.floor(geo.index.count * progress.current));
      }
      if (progress.current >= 1) {
        tubeRef.current?.geometry.setDrawRange(0, Infinity);
      }
    }
    // Milestone spheres pop in as the ribbon reaches them
    groupRef.current?.children.forEach((child, i) => {
      const reveal = (i + 1) / positions.length;
      const target = progress.current >= reveal ? 1 : 0.001;
      child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, target, 0.2));
    });
  });

  const opacity = dimmed ? 0.18 : selected ? 0.95 : 0.55;

  return (
    <group>
      <mesh ref={tubeRef}>
        <tubeGeometry args={[curve, 120, selected ? 0.09 : 0.065, 8, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.9 : 0.4}
          transparent
          opacity={opacity}
          roughness={0.3}
        />
      </mesh>

      <group ref={groupRef}>
        {route.milestones.map((m, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const isRisk = Boolean(m.riskFlag);
          const isSel = selectedMilestoneId === m.id;
          return (
            <group key={m.id} position={pos}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMilestone(route.id, m.id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'auto';
                }}
              >
                <sphereGeometry args={[isSel ? 0.22 : 0.15, 16, 16]} />
                <meshStandardMaterial
                  color={isRisk ? '#F0564A' : color}
                  emissive={isRisk ? '#F0564A' : color}
                  emissiveIntensity={isSel ? 1.4 : 0.7}
                  transparent
                  opacity={dimmed ? 0.25 : 1}
                />
              </mesh>
              {isSel && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.2, 0.26, 32]} />
                  <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      {/* Route name label above the ribbon's own lane */}
      <Html
        zIndexRange={[5, 0]}
        center
        position={[laneX, laneX <= 0 ? 2.4 : 3.2, -0.6]}
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: selected ? color : 'rgba(255,255,255,0.85)',
            color: selected ? '#fff' : '#1B2340',
            border: `1px solid ${color}66`,
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            maxWidth: '46vw',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: dimmed ? 0.3 : 1,
            backdropFilter: 'blur(6px)',
          }}
        >
          {displayName}
        </div>
      </Html>
    </group>
  );
}

function UniverseCamera({
  rewind,
  focusCurve,
  reducedMotion,
}: {
  rewind: number; // 0..1 along the selected route (1 = full view)
  focusCurve: THREE.CatmullRomCurve3 | null;
  reducedMotion: boolean;
}): null {
  const { camera, pointer } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.8, -6));

  useFrame(() => {
    let targetPos: THREE.Vector3;
    let targetLook: THREE.Vector3;
    if (focusCurve && rewind < 1) {
      const p = focusCurve.getPoint(Math.max(0.02, rewind));
      targetPos = p.clone().add(new THREE.Vector3(1.8, 1.6, 3.2));
      targetLook = p;
    } else {
      targetPos = new THREE.Vector3(
        reducedMotion ? 0 : pointer.x * 1.2,
        8.5 + (reducedMotion ? 0 : pointer.y * 0.6),
        14,
      );
      targetLook = new THREE.Vector3(0, 0.4, -7);
    }
    camera.position.lerp(targetPos, 0.05);
    look.current.lerp(targetLook, 0.05);
    camera.lookAt(look.current);
  });
  return null;
}

export function UniverseScene({
  routes,
  selectedRouteId,
  selectedMilestoneId,
  onSelectMilestone,
  rewind,
  routeNames,
  animKey,
}: {
  routes: SimRoute[];
  selectedRouteId: string | null;
  selectedMilestoneId: string | null;
  onSelectMilestone: (routeId: string, milestoneId: string) => void;
  rewind: number;
  routeNames: Record<string, string>;
  /** changes when assumptions change → ribbons regrow (branch animation) */
  animKey: string;
}): React.JSX.Element {
  const { reducedMotion, tier } = useQuality();
  const lanes = routes.length;
  const spread = 9;

  const focusCurve = useMemo(() => {
    const idx = routes.findIndex((r) => r.id === selectedRouteId);
    if (idx === -1) return null;
    const route = routes[idx];
    if (!route) return null;
    const laneX = (idx - (lanes - 1) / 2) * spread;
    return routeCurve(route, laneX);
  }, [routes, selectedRouteId, lanes]);

  return (
    <group>
      <color attach="background" args={['#f4f6fc']} />
      <fog attach="fog" args={['#f4f6fc', 14, 34]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 10, 6]} intensity={1.0} />
      <pointLight position={[0, 6, 0]} intensity={20} color="#8B5CF6" />

      {/* Year rings — subtle time guides radiating from Now */}
      {[12, 24, 48, 84].map((m) => {
        const r = 3 - monthZ(m);
        return (
          <mesh key={m} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 3]}>
            <ringGeometry args={[r - 0.02, r + 0.02, 96, 1, Math.PI * 0.75, Math.PI * 1.5]} />
            <meshBasicMaterial color="#c9d2ea" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        );
      })}

      {/* "Now" beacon */}
      <group position={[0, 0.4, 3]}>
        <mesh>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshStandardMaterial color="#ffffff" emissive="#00B8D9" emissiveIntensity={1.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
          <ringGeometry args={[0.45, 0.55, 40]} />
          <meshBasicMaterial color="#00B8D9" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>


      {routes.map((route, i) => {
        const laneX = (i - (lanes - 1) / 2) * spread;
        return (
          <RouteRibbon
            key={`${route.id}-${animKey}`}
            route={route}
            laneX={laneX}
            selected={selectedRouteId === route.id}
            dimmed={selectedRouteId !== null && selectedRouteId !== route.id && rewind < 1}
            reducedMotion={reducedMotion}
            onSelectMilestone={onSelectMilestone}
            selectedMilestoneId={selectedMilestoneId}
            displayName={routeNames[route.id] ?? route.nameEn}
          />
        );
      })}

      {tier === 'A' && <Sparkles />}

      <UniverseCamera rewind={rewind} focusCurve={focusCurve} reducedMotion={reducedMotion} />
    </group>
  );
}

/** Soft ambient particles (Tier A only). */
function Sparkles(): React.JSX.Element {
  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    let v = 7;
    const rand = (): number => {
      v = (v * 16807) % 2147483647;
      return v / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 24;
      arr[i * 3 + 1] = rand() * 8;
      arr[i * 3 + 2] = -rand() * 24 + 4;
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#8B5CF6" size={0.05} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}
