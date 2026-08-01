/**
 * Tokyo university district — scene data.
 *
 * IMPORTANT: the 3D models these entries drive are *stylised visual
 * representations* inspired by each campus's best-known landmark. They are not
 * architectural reproductions and must never be presented as such. No licensed
 * or surveyed building data is used anywhere in this scene.
 */

export type CampusModel =
  | 'clock-tower' // UTokyo — Yasuda-Auditorium-inspired central clock tower
  | 'okuma-tower' // Waseda — Okuma-Auditorium-inspired hall + slim clock tower
  | 'brick-library' // Keio — Mita-old-library-inspired red brick + corner turret
  | 'glass-twin' // Institute of Science Tokyo — modern paired research towers
  | 'domed-hall' // Hitotsubashi — Kanematsu-Auditorium-inspired copper dome
  | 'liberty-tower'; // Meiji — Liberty-Tower-inspired slender high-rise

export interface CampusEntry {
  id: string;
  nameEn: string;
  nameJa: string;
  model: CampusModel;
  /** Accent colour, drawn from the CareerVerse token palette. */
  accent: string;
  /** Angle around the district ring, in degrees. */
  angle: number;
  /** Ring radius — varied so the district reads with depth, not as a circle. */
  radius: number;
  /** Uniform scale tweak per campus. */
  scale: number;
}

/**
 * Six campuses spaced around a ring. Angles avoid 90° (dead centre front) so
 * nothing sits directly between the camera and the hero card at rest.
 */
export const CAMPUSES: readonly CampusEntry[] = [
  {
    id: 'utokyo',
    nameEn: 'The University of Tokyo',
    nameJa: '東京大学',
    model: 'clock-tower',
    accent: '#3D4A8C',
    angle: 148,
    radius: 32.5,
    scale: 0.6,
  },
  {
    id: 'keio',
    nameEn: 'Keio University',
    nameJa: '慶應義塾大学',
    model: 'brick-library',
    accent: '#D83E33',
    angle: 202,
    radius: 30.2,
    scale: 0.55,
  },
  {
    id: 'hitotsubashi',
    nameEn: 'Hitotsubashi University',
    nameJa: '一橋大学',
    model: 'domed-hall',
    accent: '#0D946A',
    angle: 252,
    radius: 33.2,
    scale: 0.57,
  },
  {
    id: 'science-tokyo',
    nameEn: 'Institute of Science Tokyo',
    nameJa: '東京科学大学',
    model: 'glass-twin',
    accent: '#009CBE',
    angle: 300,
    radius: 31.6,
    scale: 0.55,
  },
  {
    id: 'waseda',
    nameEn: 'Waseda University',
    nameJa: '早稲田大学',
    model: 'okuma-tower',
    accent: '#7C4DF6',
    angle: 348,
    radius: 30.8,
    scale: 0.58,
  },
  {
    id: 'meiji',
    nameEn: 'Meiji University',
    nameJa: '明治大学',
    model: 'liberty-tower',
    accent: '#925406',
    angle: 40,
    radius: 34.2,
    scale: 0.55,
  },
] as const;

/** World-space position for a campus entry. */
export function campusPosition(c: CampusEntry): [number, number, number] {
  const rad = (c.angle * Math.PI) / 180;
  return [Math.cos(rad) * c.radius, 0, Math.sin(rad) * c.radius];
}

/**
 * Facing angle. The camera orbits *outside* the ring, so each campus turns its
 * front facade outward, away from the district centre.
 */
export function campusFacing(c: CampusEntry): number {
  const [x, , z] = campusPosition(c);
  return Math.atan2(x, z);
}

/**
 * Architectural-model palette. Hue is deliberately restrained — materials are
 * separated by value and roughness rather than colour, the way a physical
 * presentation model or an architectural render reads. Saturated colour is what
 * makes a massing model look like a toy, so there is almost none here; the
 * warmth in the scene comes from the golden-hour key light, not the albedo.
 */
export const PALETTE = {
  stone: '#e6e1d8',
  stoneDark: '#d2ccc1',
  stoneShade: '#bdb6aa',
  brick: '#b28c7d',
  brickDark: '#9c7768',
  roof: '#5b6270',
  roofDark: '#474d59',
  copper: '#8fae9f',
  glass: '#b9c9da',
  glassDark: '#93a8bd',
  concrete: '#dcdcd9',
  metal: '#a9adb4',
  trunk: '#6f6357',
  foliage: '#7c8f76',
  foliageDeep: '#68785f',
  ground: '#bcbbb4',
  lawn: '#93a486',
  paving: '#c6c4be',
  road: '#9d9e9d',
  plaza: '#cfccc4',
  skyline: '#c2c8d2',
} as const;
