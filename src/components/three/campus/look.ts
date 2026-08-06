/**
 * Material tiers for the hero scene.
 *
 * The scene has one job beyond looking good: it has to say which objects are
 * DATA and which are CONTEXT. A visitor should land on the labelled universities
 * before they read a word. That is a hierarchy problem, and hierarchy is carried
 * by saturation and value, not by detail.
 *
 *   LANDMARK — the labelled universities. Brand indigo, the only saturated
 *              objects anywhere in the scene, with a faint emissive of the same
 *              hue so they hold up against the sky at low elevations.
 *   CONTEXT  — everything else built. A tight band of warm desaturated greys.
 *              The band is deliberately narrow: spreading context values wide
 *              makes the fabric compete with the landmarks for attention.
 *   GROUND   — the simulation surface. Matte, with a faint instrument grid.
 *
 * Within the landmark tier the values still step (roof darker than wall, glazing
 * lighter) so cornices, plinths and rooflines stay legible. Same hue throughout:
 * the models are told apart by silhouette, which is how a presentation model
 * reads, and flattening them to one value would throw that away.
 */

/** Brand indigo — `--cv-indigo`, rgb(61 74 140). */
export const BRAND_INDIGO = '#3D4A8C';

/**
 * Landmark palette. Keys mirror the context palette's names so the building
 * models can be retinted without touching their geometry or structure.
 */
export const LANDMARK = {
  stone: '#3D4A8C',
  stoneDark: '#35427E',
  stoneShade: '#2D3970',
  brick: '#3F4C8E',
  brickDark: '#33407A',
  roof: '#2A3468',
  roofDark: '#232C59',
  copper: '#4E5CA5',
  glass: '#5A68AB',
  glassDark: '#46549A',
  concrete: '#37437E',
  metal: '#6472B0',
  /** Small bright details — clock faces and the like. */
  detail: '#8E9AC9',
} as const;

/**
 * Landmark surface response. Smoother and slightly metallic so the indigo picks
 * up the environment and reads as a deliberate object rather than painted card.
 * The emissive is what keeps a landmark from going muddy on its shadow side.
 */
export const LANDMARK_MATERIAL = {
  roughness: 0.35,
  metalness: 0.15,
  emissive: BRAND_INDIGO,
  emissiveIntensity: 0.18,
} as const;

/** Glazing: same tier, a touch sharper. */
export const LANDMARK_GLASS = {
  roughness: 0.18,
  metalness: 0.35,
  emissive: BRAND_INDIGO,
  emissiveIntensity: 0.14,
} as const;

/** Roofing: same tier, matter, so it does not fight the walls. */
export const LANDMARK_ROOF = {
  roughness: 0.5,
  metalness: 0.1,
  emissive: BRAND_INDIGO,
  emissiveIntensity: 0.1,
} as const;

/**
 * The simulation surface the district sits on.
 *
 * The grid is drawn by a shader rather than a texture — no image asset, one draw
 * call, and it fades out by radius so it never reaches the frame edge and never
 * needs a horizon to stop against.
 */
export const GROUND = {
  roughness: 0.95,
  metalness: 0,
  grid: {
    /** World units between grid lines. */
    spacing: 8,
    /** Line half-width in world units. */
    width: 0.09,
    /** Grid is fully faded out by this radius from the district centre. */
    fadeRadius: 132,
    color: '#6E86C8',
    opacity: 0.06,
  },
} as const;

/**
 * Phase 4 accents. Both are single flags so the scene can be returned to a
 * completely unadorned state without unpicking anything.
 */
export const ACCENTS = {
  /** Emissive edge lines + locator beacons on landmarks. */
  beacons: true,
  /** Bloom / SMAA / vignette pass. Tier A only regardless of this flag. */
  bloom: true,
} as const;
