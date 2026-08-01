'use client';

/**
 * The academic district the campuses stand in: terrain, boulevards, walkways,
 * urban fabric, street planting and a fog-bound Tokyo skyline.
 *
 * The single most important element here is the urban fabric — the bands of
 * low background buildings between the landmarks. Without it the campuses read
 * as objects placed on a lawn; with it they read as landmarks inside a built
 * city, which is what makes the scene feel surveyed rather than decorative.
 *
 * Everything is instanced or a single primitive, so the whole environment costs
 * a handful of draw calls.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { CAMPUSES, PALETTE, campusPosition } from './data';

const PLAZA_R = 15.5;
const RING_ROAD_INNER = 17.6;
const RING_ROAD_OUTER = 20.6;
const FABRIC_OUTER = 52;

/** Deterministic PRNG so the layout is identical on every render and reload. */
function makeRandom(seed: number): () => number {
  let v = seed;
  return () => {
    v = (v * 16807) % 2147483647;
    return v / 2147483647;
  };
}

const CAMPUS_XZ = CAMPUSES.map(campusPosition);
const clearOfCampuses = (x: number, z: number, pad: number): boolean =>
  !CAMPUS_XZ.some(([cx, , cz]) => Math.hypot(x - cx, z - cz) < pad);

/** Writes a matrix list into an InstancedMesh. */
function useInstances(
  matrices: THREE.Matrix4[],
): (m: THREE.InstancedMesh | null) => void {
  return (m) => {
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
  };
}

function Terrain(): React.JSX.Element {
  return (
    <group>
      {/* ground plane — standard material so it takes the key light and shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[300, 96]} />
        <meshStandardMaterial color={PALETTE.ground} roughness={0.94} metalness={0} />
      </mesh>
      {/* central plaza the hero card sits over */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <circleGeometry args={[PLAZA_R, 72]} />
        <meshStandardMaterial color={PALETTE.plaza} roughness={0.88} metalness={0.02} />
      </mesh>
      {/* paved apron marking the plaza edge — a detail line, not a glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[PLAZA_R - 1.1, PLAZA_R, 72]} />
        <meshStandardMaterial color={PALETTE.paving} roughness={0.85} metalness={0.02} />
      </mesh>
    </group>
  );
}

/** Ring boulevard plus a radial avenue out to each campus, with kerb lines. */
function Streets(): React.JSX.Element {
  return (
    <group position={[0, 0.03, 0]}>
      {CAMPUSES.map((c) => {
        const [x, , z] = campusPosition(c);
        const angle = Math.atan2(x, z);
        const len = Math.hypot(x, z) + 12;
        return (
          <group key={c.id} rotation={[0, angle, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, len / 2]} receiveShadow>
              <planeGeometry args={[4.6, len]} />
              <meshStandardMaterial color={PALETTE.road} roughness={0.9} metalness={0.02} />
            </mesh>
            {/* walkways either side */}
            {[-3.1, 3.1].map((off) => (
              <mesh
                key={off}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[off, 0.004, len / 2]}
                receiveShadow
              >
                <planeGeometry args={[1.5, len]} />
                <meshStandardMaterial color={PALETTE.paving} roughness={0.88} metalness={0.02} />
              </mesh>
            ))}
          </group>
        );
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[RING_ROAD_INNER, RING_ROAD_OUTER, 96]} />
        <meshStandardMaterial color={PALETTE.road} roughness={0.9} metalness={0.02} />
      </mesh>
      {[RING_ROAD_INNER - 1.4, RING_ROAD_OUTER].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[r, r + 1.4, 96]} />
          <meshStandardMaterial color={PALETTE.paving} roughness={0.88} metalness={0.02} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Urban fabric: concentric bands of low background buildings, aligned to the
 * radial street grid and stepping down in height away from the centre. This is
 * what turns six landmarks into a district.
 */
function UrbanFabric({ tier }: { tier: 'A' | 'B' }): React.JSX.Element {
  const { matrices, colors } = useMemo(() => {
    const rand = makeRandom(20260801);
    const t = new THREE.Object3D();
    const c = new THREE.Color();
    const out: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const bands =
      tier === 'A'
        ? [
            { r: 26, n: 20, h: [4.5, 9] },
            { r: 33.5, n: 24, h: [3.5, 7] },
          ]
        : [
            { r: 26, n: 17, h: [4.5, 9] },
            { r: 34, n: 20, h: [3.5, 6.5] },
          ];

    for (const band of bands) {
      for (let i = 0; i < band.n; i++) {
        const a = (i / band.n) * Math.PI * 2 + rand() * 0.05;
        const r = band.r + (rand() - 0.5) * 1.6;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (!clearOfCampuses(x, z, 9.5)) continue;
        // leave the radial avenues open
        const nearest = CAMPUSES.reduce((best, cam) => {
          const ca = Math.atan2(campusPosition(cam)[2], campusPosition(cam)[0]);
          const diff = Math.abs(Math.atan2(Math.sin(a - ca), Math.cos(a - ca)));
          return Math.min(best, diff);
        }, Math.PI);
        if (nearest < 0.085) continue;

        const h = band.h[0]! + rand() * (band.h[1]! - band.h[0]!);
        const w = 3.3 + rand() * 1.9;
        const d = 3.1 + rand() * 1.7;
        t.position.set(x, h / 2, z);
        t.scale.set(w, h, d);
        t.rotation.set(0, Math.atan2(x, z), 0);
        t.updateMatrix();
        out.push(t.matrix.clone());
        // Per-instance value variation. A single flat tone across a hundred
        // boxes reads as one undifferentiated mass; a few percent of spread
        // reads as separate buildings without introducing any hue.
        const v = 0.9 + rand() * 0.2;
        cols.push(c.clone().setRGB(0.66 * v, 0.67 * v, 0.69 * v));
      }
    }
    return { matrices: out, colors: cols };
  }, [tier]);

  const setRef = (m: THREE.InstancedMesh | null): void => {
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    colors.forEach((col, i) => m.setColorAt(i, col));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };

  if (matrices.length === 0) return <group />;

  return (
    <instancedMesh
      args={[undefined, undefined, matrices.length]}
      ref={setRef}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={0.88} metalness={0.02} />
    </instancedMesh>
  );
}

/**
 * Street planting. Rounded canopies rather than cones — a cone reads as a
 * conifer in a game asset pack, an ellipsoid reads as a model tree.
 */
function Planting({ count }: { count: number }): React.JSX.Element {
  const { trunks, crowns } = useMemo(() => {
    const rand = makeRandom(1337);
    const t = new THREE.Object3D();
    const trunkM: THREE.Matrix4[] = [];
    const crownM: THREE.Matrix4[] = [];
    let guard = 0;
    while (crownM.length < count && guard < count * 60) {
      guard += 1;
      const a = rand() * Math.PI * 2;
      const r = PLAZA_R + 1.2 + rand() * (FABRIC_OUTER - PLAZA_R - 4);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (r > RING_ROAD_INNER - 1.6 && r < RING_ROAD_OUTER + 1.6) continue;
      if (!clearOfCampuses(x, z, 8.5)) continue;
      const s = 0.42 + rand() * 0.24;

      t.rotation.set(0, rand() * Math.PI, 0);
      t.position.set(x, 0.55 * s, z);
      t.scale.set(s, s, s);
      t.updateMatrix();
      trunkM.push(t.matrix.clone());

      t.position.set(x, 1.75 * s, z);
      t.scale.set(s * 1.05, s * 0.92, s * 1.05);
      t.updateMatrix();
      crownM.push(t.matrix.clone());
    }
    return { trunks: trunkM, crowns: crownM };
  }, [count]);

  const trunkRef = useInstances(trunks);
  const crownRef = useInstances(crowns);
  if (crowns.length === 0) return <group />;

  return (
    <group>
      <instancedMesh args={[undefined, undefined, trunks.length]} ref={trunkRef} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.1, 6]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={0.95} metalness={0} />
      </instancedMesh>
      <instancedMesh args={[undefined, undefined, crowns.length]} ref={crownRef} castShadow>
        <sphereGeometry args={[0.95, 10, 7]} />
        <meshStandardMaterial color={PALETTE.foliage} roughness={0.92} metalness={0} />
      </instancedMesh>
    </group>
  );
}

/**
 * Plaza surface: concentric paving bands, radial joints and a ring of planters.
 * The plaza sits directly under the hero card, so at rest almost none of this is
 * visible — it earns its place at the orbit angles where the plaza swings into
 * the foreground and would otherwise be a bare disc.
 */
function PlazaSurface(): React.JSX.Element {
  const joints = useMemo(() => {
    const t = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = (PLAZA_R - 1.2 + 4.6) / 2;
      t.position.set(Math.cos(a) * r, 0.026, Math.sin(a) * r);
      t.rotation.set(0, -a, 0);
      t.scale.set(PLAZA_R - 1.2 - 4.6, 1, 1);
      t.updateMatrix();
      out.push(t.matrix.clone());
    }
    return out;
  }, []);

  const { kerbs, hedges } = useMemo(() => {
    const t = new THREE.Object3D();
    const k: THREE.Matrix4[] = [];
    const h: THREE.Matrix4[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.26;
      const r = PLAZA_R - 2.6;
      t.rotation.set(0, -a, 0);
      t.scale.set(1, 1, 1);
      t.position.set(Math.cos(a) * r, 0.22, Math.sin(a) * r);
      t.updateMatrix();
      k.push(t.matrix.clone());
      // hedge sits on top of the kerb, not inside it
      t.position.set(Math.cos(a) * r, 0.66, Math.sin(a) * r);
      t.updateMatrix();
      h.push(t.matrix.clone());
    }
    return { kerbs: k, hedges: h };
  }, []);

  const jointRef = useInstances(joints);
  const kerbRef = useInstances(kerbs);
  const hedgeRef = useInstances(hedges);

  return (
    <group>
      {/* inner paving band */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} receiveShadow>
        <ringGeometry args={[4.6, PLAZA_R - 3.4, 64]} />
        <meshStandardMaterial color={PALETTE.paving} roughness={0.86} metalness={0.02} />
      </mesh>
      {/* central medallion */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]} receiveShadow>
        <circleGeometry args={[4.6, 48]} />
        <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.8} metalness={0.03} />
      </mesh>
      <instancedMesh args={[undefined, undefined, joints.length]} ref={jointRef}>
        <boxGeometry args={[1, 0.02, 0.16]} />
        <meshStandardMaterial color={PALETTE.stoneShade} roughness={0.85} metalness={0.02} />
      </instancedMesh>
      {/* low planters — stone kerb with a clipped hedge on top */}
      <instancedMesh args={[undefined, undefined, kerbs.length]} ref={kerbRef} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.44, 1.1]} />
        <meshStandardMaterial color={PALETTE.stoneShade} roughness={0.88} metalness={0.02} />
      </instancedMesh>
      <instancedMesh args={[undefined, undefined, hedges.length]} ref={hedgeRef} castShadow>
        <boxGeometry args={[2.9, 0.44, 0.82]} />
        <meshStandardMaterial color={PALETTE.foliageDeep} roughness={0.94} metalness={0} />
      </instancedMesh>
    </group>
  );
}

/**
 * Secondary walkways crossing the green between the radial avenues, plus a
 * paved forecourt in front of each campus. Fills the mid-ground band that was
 * reading as bare lawn without adding a single new object type.
 */
function Walkways(): React.JSX.Element {
  const spokes = useMemo(() => {
    const angles: number[] = [];
    const campusAngles = CAMPUSES.map((c) => {
      const [x, , z] = campusPosition(c);
      return Math.atan2(x, z);
    }).sort((a, b) => a - b);
    for (let i = 0; i < campusAngles.length; i++) {
      const a = campusAngles[i]!;
      const b = campusAngles[(i + 1) % campusAngles.length]! + (i + 1 === campusAngles.length ? Math.PI * 2 : 0);
      angles.push((a + b) / 2);
    }
    return angles;
  }, []);

  return (
    <group position={[0, TERRACE_H + 0.01, 0]}>
      {spokes.map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (PLAZA_R + RING_ROAD_OUTER + 4) / 2]} receiveShadow>
            <planeGeometry args={[1.8, RING_ROAD_OUTER + 4 - PLAZA_R]} />
            <meshStandardMaterial color={PALETTE.paving} roughness={0.88} metalness={0.02} />
          </mesh>
        </group>
      ))}
      {/* campus forecourts */}
      {CAMPUSES.map((c) => {
        const [x, , z] = campusPosition(c);
        const a = Math.atan2(x, z);
        const r = Math.hypot(x, z) - 6.4;
        return (
          <mesh
            key={c.id}
            rotation={[-Math.PI / 2, 0, -a]}
            position={[Math.sin(a) * r, 0, Math.cos(a) * r]}
            receiveShadow
          >
            <planeGeometry args={[12, 5]} />
            <meshStandardMaterial color={PALETTE.paving} roughness={0.87} metalness={0.02} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Subtle terrain relief: two broad, very low terraces stepping down away from
 * the plaza. At 0.3 units they never obstruct anything, but they give the
 * ground a section instead of reading as one flat sheet.
 */
const TERRACE_H = 0.26;

function Terraces(): React.JSX.Element {
  // Two raised lawn bands either side of the ring boulevard, so the road reads
  // as a shallow cutting rather than a stripe painted on a flat sheet.
  const bands: Array<[number, number]> = [
    [PLAZA_R, RING_ROAD_INNER - 1.4],
    [RING_ROAD_OUTER + 1.4, 27.5],
  ];
  return (
    <group>
      {bands.map(([inner, outer]) => (
        <group key={`${inner}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TERRACE_H, 0]} receiveShadow>
            <ringGeometry args={[inner, outer, 96]} />
            <meshStandardMaterial color={PALETTE.lawn} roughness={0.95} metalness={0} />
          </mesh>
          {/* retaining faces on both edges of the band */}
          {[inner, outer].map((r) => (
            <mesh key={r} position={[0, TERRACE_H / 2, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[r, r, TERRACE_H, 96, 1, true]} />
              <meshStandardMaterial
                color={PALETTE.stoneShade}
                roughness={0.9}
                metalness={0.02}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * Low-rise infill: single-storey annexes tucked against the fabric bands.
 * Breaks the uniform block heights and closes the gaps that read as holes.
 */
function LowRiseInfill({ tier }: { tier: 'A' | 'B' }): React.JSX.Element {
  const matrices = useMemo(() => {
    const rand = makeRandom(556677);
    const t = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    const n = tier === 'A' ? 96 : 52;
    let guard = 0;
    while (out.length < n && guard < n * 40) {
      guard += 1;
      const a = rand() * Math.PI * 2;
      const r = RING_ROAD_OUTER + 2.4 + rand() * 26;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!clearOfCampuses(x, z, 8)) continue;
      const h = 0.9 + rand() * 2.2;
      t.position.set(x, h / 2, z);
      t.scale.set(2.4 + rand() * 2.2, h, 2.2 + rand() * 1.8);
      t.rotation.set(0, Math.atan2(x, z) + (rand() - 0.5) * 0.12, 0);
      t.updateMatrix();
      out.push(t.matrix.clone());
    }
    return out;
  }, [tier]);

  const ref = useInstances(matrices);
  if (matrices.length === 0) return <group />;
  return (
    <instancedMesh args={[undefined, undefined, matrices.length]} ref={ref} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.9} metalness={0.02} />
    </instancedMesh>
  );
}

/**
 * Evenly spaced street trees along the ring boulevard. Random scatter reads as
 * countryside; a regular row reads as a designed street, which is the cue that
 * makes the whole thing feel planned.
 */
function BoulevardTrees({ count }: { count: number }): React.JSX.Element {
  const { trunks, crowns } = useMemo(() => {
    const t = new THREE.Object3D();
    const trunkM: THREE.Matrix4[] = [];
    const crownM: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = i % 2 === 0 ? RING_ROAD_INNER - 2.4 : RING_ROAD_OUTER + 2.4;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!clearOfCampuses(x, z, 7)) continue;
      const s = 0.5;
      t.rotation.set(0, a, 0);
      t.position.set(x, 0.55 * s, z);
      t.scale.set(s, s, s);
      t.updateMatrix();
      trunkM.push(t.matrix.clone());
      t.position.set(x, 1.75 * s, z);
      t.scale.set(s * 1.02, s * 0.94, s * 1.02);
      t.updateMatrix();
      crownM.push(t.matrix.clone());
    }
    return { trunks: trunkM, crowns: crownM };
  }, [count]);

  const trunkRef = useInstances(trunks);
  const crownRef = useInstances(crowns);
  if (crowns.length === 0) return <group />;

  return (
    <group>
      <instancedMesh args={[undefined, undefined, trunks.length]} ref={trunkRef} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.1, 6]} />
        <meshStandardMaterial color={PALETTE.trunk} roughness={0.95} metalness={0} />
      </instancedMesh>
      <instancedMesh args={[undefined, undefined, crowns.length]} ref={crownRef} castShadow>
        <sphereGeometry args={[0.95, 10, 7]} />
        <meshStandardMaterial color={PALETTE.foliageDeep} roughness={0.92} metalness={0} />
      </instancedMesh>
    </group>
  );
}

/**
 * An elevated transit viaduct skirting the district. Routed as a chord well
 * outside every campus footprint so it never crosses a landmark or the plaza.
 * One of the strongest "this is a real place" cues available for three meshes.
 */
function Transit(): React.JSX.Element {
  const LENGTH = 118;
  const OFFSET = 45; // beyond the outermost campus plus its footprint
  const piers = useMemo(() => {
    const t = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i <= 12; i++) {
      const z = -LENGTH / 2 + (i / 12) * LENGTH;
      t.position.set(0, 1.55, z);
      t.rotation.set(0, 0, 0);
      t.scale.set(1, 1, 1);
      t.updateMatrix();
      out.push(t.matrix.clone());
    }
    return out;
  }, []);
  const pierRef = useInstances(piers);

  return (
    <group rotation={[0, 0.42, 0]} position={[OFFSET, 0, 0]}>
      <instancedMesh args={[undefined, undefined, piers.length]} ref={pierRef} castShadow receiveShadow>
        <boxGeometry args={[1.5, 3.1, 1.5]} />
        <meshStandardMaterial color={PALETTE.concrete} roughness={0.9} metalness={0.02} />
      </instancedMesh>
      <mesh position={[0, 3.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 0.5, LENGTH]} />
        <meshStandardMaterial color={PALETTE.concrete} roughness={0.86} metalness={0.03} />
      </mesh>
      {[-1.9, 1.9].map((x) => (
        <mesh key={x} position={[x, 3.78, 0]} castShadow>
          <boxGeometry args={[0.24, 0.36, LENGTH]} />
          <meshStandardMaterial color={PALETTE.metal} roughness={0.45} metalness={0.55} />
        </mesh>
      ))}
      {/* station platform */}
      <mesh position={[0, 3.72, 14]} castShadow receiveShadow>
        <boxGeometry args={[7.4, 0.24, 16]} />
        <meshStandardMaterial color={PALETTE.paving} roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh position={[0, 5.3, 14]} castShadow>
        <boxGeometry args={[7.8, 0.22, 16.6]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

/** Distant Tokyo. Slimmer and taller than the fabric, and deep in the haze. */
function Skyline({ count }: { count: number }): React.JSX.Element {
  const matrices = useMemo(() => {
    const rand = makeRandom(90210);
    const t = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      // cluster rather than ring evenly, so the horizon has density variation
      const a = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.22;
      const r = 205 + rand() * 115;
      const h = 9 + rand() * rand() * 30;
      const w = 4.5 + rand() * 6;
      t.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      t.scale.set(w, h, w * (0.8 + rand() * 0.5));
      t.rotation.set(0, a + (rand() - 0.5) * 0.5, 0);
      t.updateMatrix();
      out.push(t.matrix.clone());
    }
    return out;
  }, [count]);

  const ref = useInstances(matrices);
  return (
    <instancedMesh args={[undefined, undefined, matrices.length]} ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={PALETTE.skyline} roughness={0.75} metalness={0.05} />
    </instancedMesh>
  );
}

export function District({
  tier,
  plate = false,
}: {
  tier: 'A' | 'B';
  /** True when a photographic backdrop supplies the horizon instead. */
  plate?: boolean;
}): React.JSX.Element {
  return (
    <group>
      <Terrain />
      <Terraces />
      <Streets />
      <Walkways />
      <PlazaSurface />
      <UrbanFabric tier={tier} />
      <LowRiseInfill tier={tier} />
      <Transit />
      <BoulevardTrees count={tier === 'A' ? 56 : 32} />
      <Planting count={tier === 'A' ? 120 : 54} />
      {!plate && <Skyline count={tier === 'A' ? 210 : 110} />}
    </group>
  );
}
