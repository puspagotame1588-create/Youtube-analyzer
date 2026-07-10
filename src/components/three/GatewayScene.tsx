'use client';

/**
 * The CareerVerse Gateway — a luminous floating city of possible futures.
 * Fully procedural (no downloaded assets). District landmarks are labeled via
 * DOM overlays so they react instantly to language switching.
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useQuality } from '@/lib/store/quality';

const DISTRICTS = [
  { key: 'university', pos: new THREE.Vector3(-6, 2.2, -2), color: '#00B8D9' },
  { key: 'vocational', pos: new THREE.Vector3(-2.5, 1.6, -5), color: '#8B5CF6' },
  { key: 'work', pos: new THREE.Vector3(3, 2.4, -4), color: '#10B981' },
  { key: 'scholarship', pos: new THREE.Vector3(6, 1.4, -1), color: '#F59E0B' },
  { key: 'visa', pos: new THREE.Vector3(0.5, 3.1, -8), color: '#3D4A8C' },
] as const;

export type DistrictKey = (typeof DISTRICTS)[number]['key'];

const TOWER_TINTS = ['#7dd8e8', '#b3a2f5', '#8fdcc0', '#f3cf8e', '#a9c2f2', '#e8ecf9'];

function FloatingTowers({ tier }: { tier: 'A' | 'B' }): React.JSX.Element {
  const count = tier === 'A' ? 90 : 48;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(() => {
    const arr: Array<{ x: number; z: number; h: number; s: number; phase: number; tint: string }> = [];
    // Deterministic pseudo-random layout (stable between renders)
    let v = 42;
    const rand = (): number => {
      v = (v * 16807) % 2147483647;
      return v / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 2.5 + rand() * 9;
      arr.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius - 3,
        h: 0.6 + rand() * 2.6,
        s: 0.25 + rand() * 0.5,
        phase: rand() * Math.PI * 2,
        tint: TOWER_TINTS[Math.floor(rand() * TOWER_TINTS.length)] ?? '#e8ecf9',
      });
    }
    return arr;
  }, [count]);

  // Per-instance pastel tints keep the city luminous instead of flat grey.
  useEffect(() => {
    if (!mesh.current) return;
    const c = new THREE.Color();
    seeds.forEach((seed, i) => mesh.current?.setColorAt(i, c.set(seed.tint)));
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [seeds]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    seeds.forEach((seed, i) => {
      const bob = Math.sin(t * 0.4 + seed.phase) * 0.08;
      dummy.position.set(seed.x, seed.h / 2 + bob, seed.z);
      dummy.scale.set(seed.s, seed.h, seed.s);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.28}
        roughness={0.12}
        metalness={0.05}
        transparent
        opacity={0.95}
      />
    </instancedMesh>
  );
}

function OpportunityPath({
  from,
  to,
  color,
  particles,
  animate,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  particles: number;
  animate: boolean;
}): React.JSX.Element {
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 1.6;
    return new THREE.CatmullRomCurve3([from, mid, to]);
  }, [from, to]);

  const pointsRef = useRef<THREE.Points>(null);
  const offsets = useMemo(
    () => Array.from({ length: particles }, (_, i) => i / particles),
    [particles],
  );
  const positions = useMemo(() => new Float32Array(particles * 3), [particles]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = animate ? clock.getElapsedTime() * 0.06 : 0;
    offsets.forEach((off, i) => {
      const p = curve.getPoint((off + t) % 1);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 40, 0.03, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.09} transparent opacity={0.9} sizeAttenuation />
      </points>
    </group>
  );
}

function CameraRig({ parallax }: { parallax: boolean }): null {
  const { camera, pointer, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 1.4, -2), []);
  useFrame(() => {
    // Narrow (portrait) viewports pull the camera back and up so the city
    // stays in frame above the hero panel.
    const narrow = size.width / size.height < 0.8;
    const baseY = narrow ? 5.5 : 4;
    const baseZ = narrow ? 19 : 14;
    const px = parallax ? pointer.x * 1.4 : 0;
    const py = parallax ? pointer.y * 0.7 : 0;
    camera.position.x += (px - camera.position.x) * 0.03;
    camera.position.y += (baseY + py - camera.position.y) * 0.03;
    camera.position.z += (baseZ - camera.position.z) * 0.03;
    camera.lookAt(target);
  });
  return null;
}

export function GatewayScene({
  labels,
}: {
  labels: Record<DistrictKey, string>;
}): React.JSX.Element {
  const { tier, reducedMotion } = useQuality();
  const t = tier === 'A' ? 'A' : 'B';
  const origin = useMemo(() => new THREE.Vector3(0, 0.4, 4), []);

  return (
    <group>
      <color attach="background" args={['#f4f6fc']} />
      <fog attach="fog" args={['#f4f6fc', 12, 30]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} color="#ffffff" />
      <pointLight position={[-6, 5, -2]} intensity={30} color="#8B5CF6" />
      <pointLight position={[6, 4, -3]} intensity={25} color="#00B8D9" />

      <FloatingTowers tier={t} />

      {/* Ground disc — the floating island (basic material stays pearl-bright) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -2]}>
        <circleGeometry args={[13, 48]} />
        <meshBasicMaterial color="#eef1fa" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -2]}>
        <ringGeometry args={[12.4, 13, 64]} />
        <meshBasicMaterial color="#00B8D9" transparent opacity={0.18} />
      </mesh>

      {DISTRICTS.map((d) => (
        <group key={d.key} position={d.pos}>
          <mesh>
            <icosahedronGeometry args={[0.42, 1]} />
            <meshStandardMaterial
              color={d.color}
              emissive={d.color}
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, -d.pos.y + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.62, 32]} />
            <meshBasicMaterial color={d.color} transparent opacity={0.4} />
          </mesh>
          <Html
            center
            distanceFactor={12}
            position={[0, 0.85, 0]}
            zIndexRange={[5, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: `1px solid ${d.color}55`,
                color: '#1B2340',
                borderRadius: 999,
                padding: '3px 12px',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(6px)',
              }}
            >
              {labels[d.key]}
            </div>
          </Html>
        </group>
      ))}

      {DISTRICTS.map((d) => (
        <OpportunityPath
          key={`path-${d.key}`}
          from={origin}
          to={d.pos}
          color={d.color}
          particles={tier === 'A' ? 26 : 12}
          animate={!reducedMotion}
        />
      ))}

      <CameraRig parallax={!reducedMotion} />
    </group>
  );
}
