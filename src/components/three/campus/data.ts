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

/** Shared material palette — warm stone, brick, glass and foliage. */
export const PALETTE = {
  stone: '#dcd3c4',
  stoneDark: '#c2b7a5',
  brick: '#a8544a',
  brickDark: '#8f463d',
  roof: '#49536b',
  roofDark: '#3a4258',
  copper: '#7fb59b',
  glass: '#9fc0e4',
  glassDark: '#7ea4cf',
  concrete: '#e6e9f2',
  trunk: '#8a7460',
  foliage: '#7fa88a',
  foliageLight: '#9cc0a4',
  ground: '#e9edf3',
  lawn: '#cfe0cf',
  road: '#d3d8e4',
  plaza: '#f0f2f8',
  skyline: '#c8d5ea',
} as const;
