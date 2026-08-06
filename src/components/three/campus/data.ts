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
 * CONTEXT tier — the district everything else is made of.
 *
 * This is background, and it is styled to lose. Hue is near-neutral warm grey
 * and the whole palette sits inside a narrow value band, because the landmarks
 * (see ./look) are the only saturated objects in the scene and anything here
 * with colour or contrast in it competes with them.
 *
 * The planting is the case that matters most: real foliage green is the second
 * most saturated thing a scene like this can contain, and at a hundred instances
 * it pulls the eye straight off the universities. It is desaturated to a grey-
 * green that still reads as planting in silhouette.
 */
export const PALETTE = {
  stone: '#cdc8bf',
  stoneDark: '#c2bcb2',
  stoneShade: '#b4aea4',
  brick: '#bdb2a8',
  brickDark: '#ada197',
  roof: '#9a968f',
  roofDark: '#8b8781',
  copper: '#b0aca3',
  glass: '#c4c3bd',
  glassDark: '#b3b2ac',
  concrete: '#c8c5bd',
  metal: '#b0aeaa',
  trunk: '#7d766c',
  // Desaturated, but not lightened: taken any paler these read as pale blobs
  // rather than planting. Value carries the canopy, saturation is what had to go.
  foliage: '#7e8578',
  foliageDeep: '#6f7669',
  ground: '#bfbbb3',
  lawn: '#b3b5a5',
  paving: '#c6c3bc',
  road: '#b0aeaa',
  plaza: '#cac6be',
  skyline: '#cdcac4',
} as const;
