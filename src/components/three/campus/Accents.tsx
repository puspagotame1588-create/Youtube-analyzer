'use client';

/**
 * Landmark accents — the only deliberately "futuristic" elements in the scene.
 *
 * Two of them, both restrained on purpose:
 *
 *   LandmarkEdges  a thin emissive wireframe on the labelled universities only,
 *                  which reads as a drawing laid over a model rather than as a
 *                  glow. Every campus collapses to ONE lineSegments draw call:
 *                  each building is a dozen-odd primitive meshes, and adding a
 *                  line object per mesh would have cost ~90 draw calls for an
 *                  effect that is a few hundred vertices in total.
 *
 *   Beacon         a soft vertical light column above each labelled building.
 *                  It earns its place for a compositional reason, not a
 *                  decorative one: the hero card covers the middle of the frame
 *                  and hides the campuses behind it, and a column rises into
 *                  the clear area above the card, so a landmark announces
 *                  itself even when the building itself is occluded.
 *
 * Both are gated behind ACCENTS.beacons in ./look, and neither is rendered
 * below tier A.
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BRAND_INDIGO } from './look';

/**
 * Builds one merged edge geometry for everything under `target`.
 *
 * Positions are baked into the target's local space, so the result can be
 * rendered as a sibling of the building without re-applying its transform.
 */
function buildMergedEdges(target: THREE.Object3D): THREE.BufferGeometry | null {
  target.updateMatrixWorld(true);
  const toLocal = new THREE.Matrix4().copy(target.matrixWorld).invert();
  const points: number[] = [];
  const v = new THREE.Vector3();

  target.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) return;
    // 25° keeps creases and silhouettes and drops the tessellation seams on
    // domes and cylinders, which are what make a wireframe look like a mistake.
    const edges = new THREE.EdgesGeometry(child.geometry, 25);
    const pos = edges.getAttribute('position');
    const m = new THREE.Matrix4().multiplyMatrices(toLocal, child.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos as THREE.BufferAttribute, i).applyMatrix4(m);
      points.push(v.x, v.y, v.z);
    }
    edges.dispose();
  });

  if (points.length === 0) return null;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geom;
}

export function LandmarkEdges({ children }: { children: React.ReactNode }): React.JSX.Element {
  const contentRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const line = lineRef.current;
    if (!content || !line) return;
    const geom = buildMergedEdges(content);
    if (!geom) return;
    line.geometry.dispose();
    line.geometry = geom;
    return () => geom.dispose();
  }, []);

  return (
    <group>
      <group ref={contentRef}>{children}</group>
      <lineSegments ref={lineRef} renderOrder={2}>
        <bufferGeometry />
        <lineBasicMaterial
          color={BRAND_INDIGO}
          transparent
          opacity={0.28}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

/**
 * Locator column. An open cylinder whose alpha falls off toward the top and is
 * eased in at the base, blended additively — so it reads as light in the air
 * rather than as a plastic tube. Cheap enough to be one draw call per campus.
 */
export function Beacon({
  position,
  height,
  radius = 1.3,
}: {
  position: [number, number, number];
  height: number;
  radius?: number;
}): React.JSX.Element {
  const params = useMemo(
    () =>
      ({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uColor: { value: new THREE.Color(BRAND_INDIGO) },
          uOpacity: { value: 0.22 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            // Falls away toward the top; eased in at the base so the column
            // does not start on a hard edge at the roofline.
            float up = pow(1.0 - vUv.y, 1.6);
            float base = smoothstep(0.0, 0.08, vUv.y);
            float a = up * base * uOpacity;
            if (a < 0.002) discard;
            gl_FragColor = vec4(uColor, a);
          }
        `,
      }) satisfies THREE.ShaderMaterialParameters,
    [],
  );

  return (
    <mesh position={[position[0], position[1] + height / 2, position[2]]} renderOrder={3}>
      <cylinderGeometry args={[radius, radius, height, 12, 1, true]} />
      <shaderMaterial args={[params]} />
    </mesh>
  );
}
