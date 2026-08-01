'use client';

/**
 * The miniature education district the campuses sit in: ground, radial roads,
 * a central plaza, instanced greenery and a fogged Tokyo skyline ring.
 *
 * Everything here is instanced or a single primitive — the whole environment is
 * a handful of draw calls so the scene stays cheap on mobile.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { CAMPUSES, PALETTE, campusPosition } from './data';

/** Deterministic PRNG so the layout is identical on every render and reload. */
function makeRandom(seed: number): () => number {
  let v = seed;
  return () => {
    v = (v * 16807) % 2147483647;
    return v / 2147483647;
  };
}

function Ground(): React.JSX.Element {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[300, 72]} />
        <meshBasicMaterial color={PALETTE.ground} />
      </mesh>
      {/* lawn ring the campuses stand on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[16, 45, 72]} />
        <meshBasicMaterial color={PALETTE.lawn} />
      </mesh>
      {/* central plaza under the hero card */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[15.5, 56]} />
        <meshBasicMaterial color={PALETTE.plaza} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[14.4, 15.5, 56]} />
        <meshBasicMaterial color="#009CBE" transparent opacity={0.14} />
      </mesh>
    </group>
  );
}

/** One road out to each campus, plus a ring road around the plaza. */
function Roads(): React.JSX.Element {
  return (
    <group position={[0, 0.015, 0]}>
      {CAMPUSES.map((c) => {
        const [x, , z] = campusPosition(c);
        const angle = Math.atan2(x, z);
        const len = Math.hypot(x, z);
        return (
          <mesh
            key={c.id}
            rotation={[-Math.PI / 2, 0, -angle]}
            position={[x / 2, 0, z / 2]}
          >
            <planeGeometry args={[3.4, len]} />
            <meshBasicMaterial color={PALETTE.road} />
          </mesh>
        );
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[17.6, 20.6, 72]} />
        <meshBasicMaterial color={PALETTE.road} />
      </mesh>
    </group>
  );
}

interface Scatter {
  x: number;
  z: number;
  s: number;
}

/** Tree positions that avoid the plaza, the ring road and each campus footprint. */
function useTreeLayout(count: number): Scatter[] {
  return useMemo(() => {
    const rand = makeRandom(1337);
    const campuses = CAMPUSES.map(campusPosition);
    const out: Scatter[] = [];
    let guard = 0;
    while (out.length < count && guard < count * 40) {
      guard += 1;
      const a = rand() * Math.PI * 2;
      const r = 17.5 + rand() * 31;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      // keep clear of the ring road
      if (r > 17.3 && r < 20.9) continue;
      // keep clear of campus footprints
      if (campuses.some(([cx, , cz]) => Math.hypot(x - cx, z - cz) < 7.6)) continue;
      out.push({ x, z, s: 0.75 + rand() * 0.6 });
    }
    return out;
  }, [count]);
}

function Trees({ count }: { count: number }): React.JSX.Element {
  const trees = useTreeLayout(count);

  const { trunks, crowns } = useMemo(() => {
    const t = new THREE.Object3D();
    const trunkM: THREE.Matrix4[] = [];
    const crownM: THREE.Matrix4[] = [];
    for (const tree of trees) {
      t.position.set(tree.x, 0.35 * tree.s, tree.z);
      t.scale.set(tree.s, tree.s, tree.s);
      t.rotation.set(0, 0, 0);
      t.updateMatrix();
      trunkM.push(t.matrix.clone());

      t.position.set(tree.x, 1.15 * tree.s, tree.z);
      t.updateMatrix();
      crownM.push(t.matrix.clone());
    }
    return { trunks: trunkM, crowns: crownM };
  }, [trees]);

  return (
    <group>
      <instancedMesh
        args={[undefined, undefined, trunks.length]}
        ref={(m) => {
          if (!m) return;
          trunks.forEach((mat, i) => m.setMatrixAt(i, mat));
          m.instanceMatrix.needsUpdate = true;
        }}
      >
        <cylinderGeometry args={[0.09, 0.13, 0.7, 5]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={0.95} />
      </instancedMesh>
      <instancedMesh
        args={[undefined, undefined, crowns.length]}
        ref={(m) => {
          if (!m) return;
          crowns.forEach((mat, i) => m.setMatrixAt(i, mat));
          m.instanceMatrix.needsUpdate = true;
        }}
      >
        <coneGeometry args={[0.72, 1.7, 6]} />
        <meshStandardMaterial color={PALETTE.foliage} roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
}

/** Distant city ring. Pale and fog-bound, it gives the district a horizon. */
function Skyline({ count }: { count: number }): React.JSX.Element {
  const blocks = useMemo(() => {
    const rand = makeRandom(90210);
    const t = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.16;
      const r = 150 + rand() * 74;
      const h = 8 + rand() * 23;
      const w = 3.4 + rand() * 5;
      t.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      t.scale.set(w, h, w);
      t.rotation.set(0, a, 0);
      t.updateMatrix();
      out.push(t.matrix.clone());
    }
    return out;
  }, [count]);

  return (
    <instancedMesh
      args={[undefined, undefined, blocks.length]}
      ref={(m) => {
        if (!m) return;
        blocks.forEach((mat, i) => m.setMatrixAt(i, mat));
        m.instanceMatrix.needsUpdate = true;
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={PALETTE.skyline} roughness={0.6} flatShading />
    </instancedMesh>
  );
}

/** A single tall landmark on the horizon, echoing Tokyo's broadcast tower. */
function HorizonTower(): React.JSX.Element {
  return (
    <group position={[86, 0, -168]}>
      <mesh position={[0, 37, 0]}>
        <cylinderGeometry args={[1.1, 6, 74, 6]} />
        <meshStandardMaterial color={PALETTE.skyline} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 79, 0]}>
        <cylinderGeometry args={[2.1, 3, 11, 6]} />
        <meshStandardMaterial color={PALETTE.skyline} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 93, 0]}>
        <cylinderGeometry args={[0.21, 0.5, 21, 4]} />
        <meshStandardMaterial color={PALETTE.skyline} />
      </mesh>
    </group>
  );
}

export function District({ tier }: { tier: 'A' | 'B' }): React.JSX.Element {
  return (
    <group>
      <Ground />
      <Roads />
      <Trees count={tier === 'A' ? 90 : 42} />
      <Skyline count={tier === 'A' ? 150 : 76} />
      <HorizonTower />
    </group>
  );
}
