'use client';

/**
 * Campus landmarks, built from primitive geometry in the manner of an
 * architectural massing model.
 *
 * These are *visual representations* inspired by each campus's best-known
 * building — recognisable silhouettes, not architectural reproductions. No
 * surveyed or licensed building data is used.
 *
 * Design rules, applied consistently so the set reads as one commissioned model
 * rather than a kit of parts:
 *  - silhouette first: massing, plinth and roofline carry the recognition, and
 *    nothing smaller than a window band is modelled
 *  - smooth shading everywhere; faceted normals are what make geometry read as
 *    a low-poly game asset
 *  - materials differ by roughness, not by hue
 *  - every model keeps its front facade on local +Z
 */

import { type CampusModel } from './data';
import {
  LANDMARK as L,
  LANDMARK_GLASS,
  LANDMARK_MATERIAL,
  LANDMARK_ROOF,
} from './look';

/**
 * All three now resolve to the landmark tier, so every campus surface carries
 * the brand hue and its faint emissive. They stay distinct because the tier
 * still steps roughness and metalness — that is what keeps a glazed tower from
 * reading like a stone hall once both are the same colour.
 */
const STONE = LANDMARK_MATERIAL;
const GLASS = LANDMARK_GLASS;
const ROOFING = LANDMARK_ROOF;

/** Plinth: the low base an institutional building sits on. Cheap, and it stops
 *  the massing from looking like a box dropped on a plane. */
function Plinth({ w, d, h = 0.34 }: { w: number; d: number; h?: number }): React.JSX.Element {
  return (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={L.stoneShade} {...STONE} />
    </mesh>
  );
}

function Mass({
  w,
  h,
  d,
  x = 0,
  y = 0,
  z = 0,
  color = L.stone,
  material = STONE,
}: {
  w: number;
  h: number;
  d: number;
  x?: number;
  y?: number;
  z?: number;
  color?: string;
  material?: { roughness: number; metalness: number };
}): React.JSX.Element {
  return (
    <mesh position={[x, y + h / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} {...material} />
    </mesh>
  );
}

/** Cornice / string course — a thin oversailing band that reads as a roofline. */
function Cornice({
  w,
  d,
  y,
  x = 0,
  z = 0,
  color = L.stoneDark,
}: {
  w: number;
  d: number;
  y: number;
  x?: number;
  z?: number;
  color?: string;
}): React.JSX.Element {
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[w, 0.22, d]} />
      <meshStandardMaterial color={color} {...STONE} />
    </mesh>
  );
}

/** Hipped roof. 24 segments keeps the ridge smooth instead of faceted. */
function HippedRoof({
  w,
  h,
  y,
  x = 0,
  z = 0,
  color = L.roof,
}: {
  w: number;
  h: number;
  y: number;
  x?: number;
  z?: number;
  color?: string;
}): React.JSX.Element {
  return (
    <mesh position={[x, y + h / 2, z]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
      <coneGeometry args={[w * 0.76, h, 4, 1]} />
      <meshStandardMaterial color={color} {...ROOFING} />
    </mesh>
  );
}

/** Recessed glazing band standing in for a storey of windows. */
function Glazing({
  w,
  d,
  y,
  x = 0,
  z = 0,
  h = 0.42,
}: {
  w: number;
  d: number;
  y: number;
  x?: number;
  z?: number;
  h?: number;
}): React.JSX.Element {
  return (
    <mesh position={[x, y, z]} castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={L.glassDark} {...GLASS} />
    </mesh>
  );
}

/** Evenly spaced pilasters — vertical rhythm on a classical facade. */
function Pilasters({
  count,
  span,
  h,
  z,
  y = 0,
}: {
  count: number;
  span: number;
  h: number;
  z: number;
  y?: number;
}): React.JSX.Element {
  const step = span / (count - 1);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[-span / 2 + i * step, y + h / 2, z]} castShadow>
          <boxGeometry args={[0.34, h, 0.3]} />
          <meshStandardMaterial color={L.stoneDark} {...STONE} />
        </mesh>
      ))}
    </group>
  );
}

function ClockFace({ y, z, r = 0.32 }: { y: number; z: number; r?: number }): React.JSX.Element {
  return (
    <group position={[0, y, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.1, 32]} />
        {/* Was a near-white #f2efe8. Left alone it would be the brightest pixel
            in the scene and the one thing the bloom pass picks up. */}
        <meshStandardMaterial color={L.detail} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.04, 12, 32]} />
        <meshStandardMaterial color={L.roofDark} roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

/** UTokyo — Yasuda Auditorium: symmetrical wings under a tall gothic centre tower. */
function ClockTowerCampus(): React.JSX.Element {
  return (
    <group>
      <Plinth w={12.4} d={7.6} />
      <Mass w={3.9} h={2.6} d={3.4} x={-3.8} y={0.34} color={L.stoneDark} />
      <Cornice w={4.2} d={3.7} y={3.02} x={-3.8} />
      <HippedRoof w={3.9} h={1.15} y={3.1} x={-3.8} />
      <Mass w={3.9} h={2.6} d={3.4} x={3.8} y={0.34} color={L.stoneDark} />
      <Cornice w={4.2} d={3.7} y={3.02} x={3.8} />
      <HippedRoof w={3.9} h={1.15} y={3.1} x={3.8} />
      <Glazing w={3.5} d={3.46} y={1.7} x={-3.8} />
      <Glazing w={3.5} d={3.46} y={1.7} x={3.8} />

      <Mass w={4.4} h={6} d={3.8} y={0.34} />
      <Pilasters count={4} span={3.6} h={5.4} z={1.94} y={0.4} />
      <Cornice w={4.8} d={4.2} y={6.5} />
      <ClockFace y={5.1} z={1.96} />
      <HippedRoof w={4.6} h={2.3} y={6.62} />
      <mesh position={[0, 9.4, 0]} castShadow>
        <coneGeometry args={[0.14, 1.2, 12]} />
        <meshStandardMaterial color={L.roofDark} {...ROOFING} />
      </mesh>
      {/* arched entrance */}
      <mesh position={[0, 1.25, 1.93]} castShadow>
        <boxGeometry args={[1.5, 1.8, 0.16]} />
        <meshStandardMaterial color={L.roofDark} roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** Waseda — Okuma Auditorium: gabled hall with an offset clock campanile. */
function OkumaTowerCampus(): React.JSX.Element {
  return (
    <group>
      <Plinth w={11} d={7.4} />
      <Mass w={6.8} h={3.5} d={4.3} x={1} y={0.34} color={L.stone} />
      <Glazing w={6.4} d={4.36} y={2.2} x={1} />
      <Cornice w={7.2} d={4.7} y={4.05} x={1} />
      <HippedRoof w={6.8} h={1.8} y={4.16} x={1} color={L.roofDark} />

      <Mass w={2.1} h={7.8} d={2.1} x={-3.5} y={0.34} color={L.stoneDark} />
      <Cornice w={2.5} d={2.5} y={8.24} x={-3.5} />
      <ClockFace y={6.9} z={1.09} r={0.27} />
      <mesh position={[-3.5, 9.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.55, 1.8, 4, 1]} />
        <meshStandardMaterial color={L.roofDark} {...ROOFING} />
      </mesh>
    </group>
  );
}

/** Keio — Mita Library: brick range with an octagonal corner turret. */
function BrickLibraryCampus(): React.JSX.Element {
  return (
    <group>
      <Plinth w={11} d={7.4} />
      <Mass w={6.6} h={3.7} d={4.4} x={1.3} y={0.34} color={L.brick} />
      <Glazing w={6.2} d={4.46} y={2.3} x={1.3} />
      <Cornice w={7} d={4.8} y={4.25} x={1.3} color={L.brickDark} />
      <HippedRoof w={6.6} h={1.7} y={4.36} x={1.3} color={L.roofDark} />

      <mesh position={[-3.1, 3.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.55, 1.6, 6.1, 8, 1]} />
        <meshStandardMaterial color={L.brickDark} {...STONE} />
      </mesh>
      <mesh position={[-3.1, 6.6, 0]} castShadow>
        <cylinderGeometry args={[1.78, 1.72, 0.24, 8]} />
        <meshStandardMaterial color={L.stoneDark} {...STONE} />
      </mesh>
      <mesh position={[-3.1, 7.75, 0]} castShadow>
        <coneGeometry args={[1.8, 2.1, 8, 1]} />
        <meshStandardMaterial color={L.roof} {...ROOFING} />
      </mesh>
      <mesh position={[1.3, 1.3, 2.24]} castShadow>
        <boxGeometry args={[1.4, 1.9, 0.16]} />
        <meshStandardMaterial color={L.roofDark} roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

/** Institute of Science Tokyo — paired research towers over a shared podium. */
function GlassTwinCampus(): React.JSX.Element {
  return (
    <group>
      <Plinth w={11} d={7.4} h={0.28} />
      <Mass w={8.8} h={1.8} d={4.7} y={0.28} color={L.concrete} />
      <Mass w={2.9} h={8.6} d={2.9} x={-2.2} z={-0.2} y={2.08} color={L.glass} material={GLASS} />
      <Mass w={2.5} h={6.4} d={2.7} x={2.4} z={0.1} y={2.08} color={L.glassDark} material={GLASS} />
      {/* floor plates read as horizontal rhythm without modelling storeys */}
      {[3.3, 4.9, 6.5, 8.1, 9.7].map((y) => (
        <mesh key={`a${y}`} position={[-2.2, y, -0.2]} castShadow>
          <boxGeometry args={[3.02, 0.12, 3.02]} />
          <meshStandardMaterial color={L.concrete} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}
      {[3.2, 4.8, 6.4].map((y) => (
        <mesh key={`b${y}`} position={[2.4, y, 0.1]} castShadow>
          <boxGeometry args={[2.62, 0.12, 2.82]} />
          <meshStandardMaterial color={L.concrete} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}
      <mesh position={[-2.2, 11, -0.2]} castShadow>
        <boxGeometry args={[1.2, 0.7, 1.2]} />
        <meshStandardMaterial color={L.metal} roughness={0.45} metalness={0.6} />
      </mesh>
    </group>
  );
}

/** Hitotsubashi — Kanematsu Auditorium: stone hall under a verdigris dome. */
function DomedHallCampus(): React.JSX.Element {
  return (
    <group>
      <Plinth w={11} d={7.6} />
      <Mass w={7.9} h={3} d={4.9} y={0.34} color={L.stone} />
      <Pilasters count={6} span={7} h={2.8} z={2.5} y={0.4} />
      <Cornice w={8.4} d={5.3} y={3.45} />
      <HippedRoof w={7.9} h={1.2} y={3.56} color={L.roof} />

      <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.9, 2.1, 1.4, 24, 1]} />
        <meshStandardMaterial color={L.stoneDark} {...STONE} />
      </mesh>
      <mesh position={[0, 5.3, 0]} castShadow>
        <sphereGeometry args={[1.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={L.copper} roughness={0.42} metalness={0.4} />
      </mesh>
      <mesh position={[0, 7.35, 0]} castShadow>
        <coneGeometry args={[0.18, 0.95, 12]} />
        <meshStandardMaterial color={L.copper} roughness={0.42} metalness={0.4} />
      </mesh>
      {[-2.4, 0, 2.4].map((x) => (
        <mesh key={x} position={[x, 1.3, 2.5]} castShadow>
          <boxGeometry args={[1, 2, 0.14]} />
          <meshStandardMaterial color={L.roofDark} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** Meiji — Liberty Tower: slender stepped high-rise. */
function LibertyTowerCampus(): React.JSX.Element {
  return (
    <group>
      <Plinth w={9.6} d={7.4} h={0.28} />
      <Mass w={7.2} h={2} d={4.8} y={0.28} color={L.concrete} />
      <Mass w={3.5} h={9} d={3.3} y={2.28} color={L.glass} material={GLASS} />
      <Mass w={2.7} h={11.2} d={2.6} y={2.28} color={L.glassDark} material={GLASS} />
      <Mass w={1.8} h={12.6} d={1.8} y={2.28} color={L.concrete} />
      {[3.6, 5.2, 6.8, 8.4, 10].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[3.62, 0.13, 3.42]} />
          <meshStandardMaterial color={L.concrete} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}
      <mesh position={[0, 15.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.8, 8]} />
        <meshStandardMaterial color={L.metal} roughness={0.35} metalness={0.7} />
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
  'clock-tower': 10,
  'okuma-tower': 10,
  'brick-library': 9.9,
  'glass-twin': 11.4,
  'domed-hall': 8.3,
  'liberty-tower': 16.5,
};
