'use client';

/**
 * Photographic backdrop plate — the far half of the hybrid hero scene.
 *
 * The near district stays real-time geometry (it has to: the labels are
 * anchored to it and it has to respond to the orbit). Everything beyond it is
 * a single image mapped to a large cylinder, so the horizon can carry
 * photographic detail that procedural boxes never will, at the cost of one
 * texture upload and one draw call.
 *
 * The plate is OFF until BACKDROP.src is set. With it null the scene renders
 * exactly as it does today, so committing this file changes nothing on its own.
 * See public/hero/README.md for the image spec.
 */

import { useEffect, useState } from 'react';
import * as THREE from 'three';

export interface BackdropConfig {
  /** Path under /public, e.g. '/hero/backdrop.webp'. Null disables the plate. */
  src: string | null;
  /**
   * How many times the image wraps around the full 360°. Use 1 for a true
   * equirectangular panorama; 3–4 for a single ~16:9 frame, where the repeat is
   * largely hidden behind the district and the haze.
   */
  repeat: number;
  /** Cylinder radius. Must sit outside MAX_DISTANCE and inside the ground disc. */
  radius: number;
  /** Cylinder height in world units. */
  height: number;
  /**
   * Vertical offset of the cylinder centre. Tune so the horizon line in the
   * image lands on the scene's y=0 ground plane.
   */
  centerY: number;
  /** Yaw offset in radians, to choose which part of the image faces front. */
  rotation: number;
  /** Scene background + fog colour, sampled from the image's sky. */
  skyColor: string;
  /**
   * Lighting to match the plate. This is the part that actually decides whether
   * a hybrid scene works: geometry lit for golden hour in front of a dusk
   * photograph reads as a collage immediately. Sample the sun colour and
   * direction from the image and set them here.
   */
  light: {
    keyColor: string;
    keyIntensity: number;
    /** Sun direction. Match the shadow direction visible in the plate. */
    keyPosition: [number, number, number];
    fillSky: string;
    fillGround: string;
    fillIntensity: number;
    exposure: number;
  };
}

/** Lighting used when no plate is present — the golden-hour default. */
export const DEFAULT_LIGHT: BackdropConfig['light'] = {
  keyColor: '#ffe2b6',
  keyIntensity: 3.9,
  /**
   * ~48° above the horizon. The previous [86,34,56] sat at 18°, which threw
   * shadows several building-lengths long — reads as late-afternoon landscape,
   * not as a lit model. Raising the sun shortens them without touching contrast.
   */
  keyPosition: [78, 104, 52],
  fillSky: '#cfe0fa',
  fillGround: '#a2988a',
  fillIntensity: 0.55,
  // Slightly over 1: the ACES shoulder pulls midtones down, and a touch of
  // exposure puts the stone back where the palette intends it.
  exposure: 1.05,
};

export const BACKDROP: BackdropConfig = {
  src: null, // ← set to '/hero/backdrop.webp' once your image is committed
  repeat: 3,
  radius: 250,
  height: 190,
  centerY: 42,
  rotation: 0,
  skyColor: '#e4ecf7',
  light: DEFAULT_LIGHT,
};

export const backdropEnabled = (c: BackdropConfig): boolean => Boolean(c.src);

/**
 * Loads a texture without suspending, and without throwing if it is missing —
 * a failed load simply leaves the procedural horizon in place.
 */
function useOptionalTexture(url: string | null, repeat: number): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }
    let cancelled = false;
    let loaded: THREE.Texture | null = null;

    new THREE.TextureLoader().load(
      url,
      (t) => {
        if (cancelled) {
          t.dispose();
          return;
        }
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        t.repeat.set(repeat, 1);
        t.anisotropy = 4;
        t.needsUpdate = true;
        loaded = t;
        setTex(t);
      },
      undefined,
      () => {
        // Missing or unreadable: stay on the procedural horizon.
        if (!cancelled) setTex(null);
      },
    );

    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [url, repeat]);

  return tex;
}

export function Backdrop({ config = BACKDROP }: { config?: BackdropConfig }): React.JSX.Element | null {
  const tex = useOptionalTexture(config.src, config.repeat);
  if (!tex) return null;

  return (
    <mesh position={[0, config.centerY, 0]} rotation={[0, config.rotation, 0]} renderOrder={-1}>
      <cylinderGeometry args={[config.radius, config.radius, config.height, 64, 1, true]} />
      {/* Unlit and un-tonemapped: the plate is already a finished, lit image, so
          re-lighting or re-grading it would only degrade it. Fog is off for the
          same reason — the photograph carries its own aerial perspective. */}
      <meshBasicMaterial
        map={tex}
        side={THREE.BackSide}
        toneMapped={false}
        fog={false}
        depthWrite={false}
      />
    </mesh>
  );
}
