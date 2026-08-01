'use client';

/**
 * Stylised campus landmarks, built entirely from primitive geometry.
 *
 * These are *visual representations* inspired by each campus's best-known
 * building — recognisable silhouettes, deliberately low-poly, not architectural
 * reproductions. No surveyed or licensed building data is used.
 *
 * Every model keeps its front facade on local +Z so the scene can turn each
 * campus outward with a single Y rotation.
 */

import { PALETTE, type CampusModel } from './data';

/** Flat contact shading in place of shadow maps — far cheaper, reads as grounded. */
function Base({ w, d, color = PALETTE.plaza }: { w: number; d: number; color?: string }): React.JSX.Element {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Wing({
  w,
  h,
  d,
  x = 0,
  z = 0,
  color = PALETTE.stone,
}: {
  w: number;
  h: number;
  d: number;
  x?: number;
  z?: number;
  color?: string;
}): React.JSX.Element {
  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
    </mesh>
  );
}

/** Pyramidal / hipped roof. 4 radial segments reads as a square pitched roof. */
function PitchedRoof({
  w,
  h,
  y,
  x = 0,
  z = 0,
  color = PALETTE.roof,
}: {
  w: number;
  h: number;
  y: number;
  x?: number;
  z?: number;
  color?: string;
}): React.JSX.Element {
  return (
    <mesh position={[x, y + h / 2, z]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[w * 0.78, h, 4]} />
      <meshStandardMaterial color={color} roughness={0.7} flatShading />
    </mesh>
  );
}

/** Horizontal glazing band — cheap stand-in for rows of windows. */
function Band({
  w,
  d,
  y,
  x = 0,
  z = 0,
  color = PALETTE.glassDark,
}: {
  w: number;
  d: number;
  y: number;
  x?: number;
  z?: number;
  color?: string;
}): React.JSX.Element {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, 0.16, d]} />
      <meshStandardMaterial color={color} roughness={0.25} metalness={0.35} />
    </mesh>
  );
}

function ClockFace({ y, z, r = 0.34 }: { y: number; z: number; r?: number }): React.JSX.Element {
  return (
    <group position={[0, y, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.09, 16]} />
        <meshStandardMaterial color="#fdfcf8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.045, 6, 16]} />
        <meshStandardMaterial color={PALETTE.roofDark} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** UTokyo — Yasuda-Auditorium-inspired: gothic centre tower with low wings. */
function ClockTowerCampus(): React.JSX.Element {
  return (
    <group>
      <Base w={11} d={7} />
      <Wing w={3.6} h={2.4} d={3.2} x={-3.6} color={PALETTE.stoneDark} />
      <PitchedRoof w={3.6} h={1.1} y={2.4} x={-3.6} />
      <Wing w={3.6} h={2.4} d={3.2} x={3.6} color={PALETTE.stoneDark} />
      <PitchedRoof w={3.6} h={1.1} y={2.4} x={3.6} />
      <Wing w={4.2} h={5.6} d={3.6} />
      <ClockFace y={4.6} z={1.85} />
      <PitchedRoof w={4.4} h={2.2} y={5.6} />
      <mesh position={[0, 8.2, 0]}>
        <coneGeometry args={[0.16, 1.1, 6]} />
        <meshStandardMaterial color={PALETTE.roofDark} />
      </mesh>
      {/* arched entrance */}
      <mesh position={[0, 0.95, 1.83]}>
        <boxGeometry args={[1.5, 1.9, 0.2]} />
        <meshStandardMaterial color={PALETTE.roofDark} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Waseda — Okuma-Auditorium-inspired: gabled hall with a slim corner tower. */
function OkumaTowerCampus(): React.JSX.Element {
  return (
    <group>
      <Base w={10} d={7} />
      <Wing w={6.4} h={3.2} d={4} x={0.9} color={PALETTE.stone} />
      <PitchedRoof w={6.4} h={1.6} y={3.2} x={0.9} color={PALETTE.roofDark} />
      <Wing w={2} h={7.4} d={2} x={-3.3} color={PALETTE.stoneDark} />
      <ClockFace y={6.4} z={1.05} r={0.28} />
      <mesh position={[-3.3, 8.1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.5, 1.7, 4]} />
        <meshStandardMaterial color={PALETTE.roofDark} flatShading />
      </mesh>
      <Band w={6.4} d={4.05} y={2.1} x={0.9} color={PALETTE.glass} />
    </group>
  );
}

/** Keio — Mita-old-library-inspired: red brick with an octagonal corner turret. */
function BrickLibraryCampus(): React.JSX.Element {
  return (
    <group>
      <Base w={10} d={7} />
      <Wing w={6.2} h={3.4} d={4.2} x={1.2} color={PALETTE.brick} />
      <PitchedRoof w={6.2} h={1.5} y={3.4} x={1.2} color={PALETTE.roofDark} />
      <mesh position={[-2.9, 2.9, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 5.8, 8]} />
        <meshStandardMaterial color={PALETTE.brickDark} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-2.9, 6.6, 0]}>
        <coneGeometry args={[1.75, 2.1, 8]} />
        <meshStandardMaterial color={PALETTE.roof} flatShading />
      </mesh>
      <Band w={6.25} d={4.25} y={2.2} x={1.2} color={PALETTE.stone} />
      <mesh position={[1.2, 1, 2.15]}>
        <boxGeometry args={[1.3, 2, 0.18]} />
        <meshStandardMaterial color={PALETTE.roofDark} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Institute of Science Tokyo — paired modern research towers. */
function GlassTwinCampus(): React.JSX.Element {
  return (
    <group>
      <Base w={10} d={7} />
      <Wing w={8.4} h={1.6} d={4.4} color={PALETTE.concrete} />
      <Wing w={2.8} h={8.2} d={2.8} x={-2.1} z={-0.2} color={PALETTE.glass} />
      <Wing w={2.4} h={6.2} d={2.6} x={2.3} z={0.1} color={PALETTE.glassDark} />
      {[2.6, 4.1, 5.6, 7.1].map((y) => (
        <Band key={y} w={2.86} d={2.86} y={y} x={-2.1} z={-0.2} color={PALETTE.concrete} />
      ))}
      {[2.4, 3.9, 5.4].map((y) => (
        <Band key={y} w={2.46} d={2.66} y={y} x={2.3} z={0.1} color={PALETTE.concrete} />
      ))}
      <mesh position={[-2.1, 8.6, -0.2]}>
        <boxGeometry args={[1.1, 0.8, 1.1]} />
        <meshStandardMaterial color={PALETTE.concrete} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Hitotsubashi — Kanematsu-Auditorium-inspired: stone hall under a copper dome. */
function DomedHallCampus(): React.JSX.Element {
  return (
    <group>
      <Base w={10} d={7} />
      <Wing w={7.6} h={2.8} d={4.6} color={PALETTE.stone} />
      <PitchedRoof w={7.6} h={1.2} y={2.8} color={PALETTE.roof} />
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[1.85, 2.05, 1.3, 12]} />
        <meshStandardMaterial color={PALETTE.stoneDark} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 4.65, 0]}>
        <sphereGeometry args={[1.85, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={PALETTE.copper} roughness={0.55} flatShading />
      </mesh>
      <mesh position={[0, 6.7, 0]}>
        <coneGeometry args={[0.2, 0.9, 6]} />
        <meshStandardMaterial color={PALETTE.copper} />
      </mesh>
      {[-2.3, 0, 2.3].map((x) => (
        <mesh key={x} position={[x, 1.1, 2.35]}>
          <boxGeometry args={[1, 2.2, 0.16]} />
          <meshStandardMaterial color={PALETTE.roofDark} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Meiji — Liberty-Tower-inspired: slender stepped high-rise. */
function LibertyTowerCampus(): React.JSX.Element {
  return (
    <group>
      <Base w={9} d={7} />
      <Wing w={7} h={1.8} d={4.6} color={PALETTE.concrete} />
      <Wing w={3.4} h={9.4} d={3.2} color={PALETTE.glass} />
      <Wing w={2.6} h={11.4} d={2.5} color={PALETTE.glassDark} />
      <Wing w={1.7} h={12.6} d={1.7} color={PALETTE.concrete} />
      {[3, 4.6, 6.2, 7.8, 9.4].map((y) => (
        <Band key={y} w={3.46} d={3.26} y={y} color={PALETTE.concrete} />
      ))}
      <mesh position={[0, 13.4, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1.6, 6]} />
        <meshStandardMaterial color={PALETTE.roofDark} />
      </mesh>
    </group>
  );
}

const MODELS: Record<CampusModel, () => React.JSX.Element> = {
  'clock-tower': ClockTowerCampus,
  'okuma-tower': OkumaTowerCampus,
  'brick-library': BrickLibraryCampus,
  'glass-twin': GlassTwinCampus,
  'domed-hall': DomedHallCampus,
  'liberty-tower': LibertyTowerCampus,
};

export function CampusBuilding({ model }: { model: CampusModel }): React.JSX.Element {
  const Model = MODELS[model];
  return <Model />;
}

/** Tallest point of each model, used to place labels clear of the roofline. */
export const MODEL_HEIGHT: Record<CampusModel, number> = {
  'clock-tower': 9.3,
  'okuma-tower': 9,
  'brick-library': 8.7,
  'glass-twin': 9.4,
  'domed-hall': 7.6,
  'liberty-tower': 15,
};
