'use client';

/**
 * The CareerVerse hero scene — a miniature Tokyo university district.
 *
 * The campuses are STYLISED VISUAL REPRESENTATIONS inspired by each university's
 * best-known landmark. They are not architectural reproductions, and nothing in
 * this scene is derived from licensed or surveyed building data.
 *
 * Camera: orbit-only (no pan) so the hero card always sits over the district
 * centre and stays readable from every permitted angle. Distance and polar
 * limits are chosen so the camera can never reach a building's footprint.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { useQuality } from '@/lib/store/quality';
import { CAMPUSES, campusFacing, campusPosition, type CampusEntry } from './campus/data';
import { CampusBuilding, MODEL_HEIGHT } from './campus/Buildings';
import { District } from './campus/District';

const TARGET = new THREE.Vector3(0, 3, 0);
const MIN_DISTANCE = 44;
const MAX_DISTANCE = 78;
const MAX_POLAR = 1.33; // keeps the camera clear of every campus footprint
const MIN_POLAR = 0.62;
const IDLE_BEFORE_AUTOROTATE_MS = 4000;

/**
 * Gates wheel-zoom behind ⌘/Ctrl so plain scrolling still moves the page.
 * Runs in the capture phase on the same element OrbitControls binds to, so an
 * unmodified wheel event never reaches the controls at all.
 */
function useModifierGatedZoom(domElement: HTMLElement): void {
  useEffect(() => {
    const onWheel = (e: WheelEvent): void => {
      if (e.ctrlKey || e.metaKey) {
        // ⌘/Ctrl + wheel — and macOS trackpad pinch, which reports ctrlKey.
        e.preventDefault();
        return;
      }
      e.stopImmediatePropagation(); // page scrolls; OrbitControls never sees it
    };
    domElement.addEventListener('wheel', onWheel, { capture: true, passive: false });
    return () => domElement.removeEventListener('wheel', onWheel, { capture: true });
  }, [domElement]);
}

/**
 * Floating campus label: English name over Japanese name, with a thin leader
 * line down to the roof. Fades out when it drifts behind the hero card.
 */
function CampusLabel({
  campus,
  position,
}: {
  campus: CampusEntry;
  position: [number, number, number];
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const world = useMemo(() => new THREE.Vector3(...position), [position]);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const shown = useRef(true);

  useFrame(({ camera }) => {
    const el = ref.current;
    if (!el) return;
    ndc.copy(world).project(camera);
    // The hero card occupies roughly the middle of the viewport; fade any label
    // that would sit on top of it rather than letting the two collide.
    const behindCard = Math.abs(ndc.x) < 0.56 && Math.abs(ndc.y) < 0.52 && ndc.z < 1;
    const next = !behindCard;
    if (next !== shown.current) {
      shown.current = next;
      el.style.opacity = next ? '1' : '0';
    }
  });

  return (
    <Html
      center
      position={position}
      distanceFactor={40}
      zIndexRange={[6, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div ref={ref} style={{ transition: 'opacity 260ms ease', willChange: 'opacity' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(27,35,64,0.10)',
            boxShadow: '0 6px 18px rgba(27,35,64,0.12)',
            color: '#1B2340',
            borderRadius: 12,
            padding: '7px 13px',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: campus.accent,
              flexShrink: 0,
            }}
          />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{campus.nameEn}</span>
            <span style={{ fontSize: 11, color: '#5A6384' }}>{campus.nameJa}</span>
          </span>
        </div>
        {/* leader line down toward the roof */}
        <div
          aria-hidden="true"
          style={{
            width: 1,
            height: 26,
            margin: '0 auto',
            background: `linear-gradient(to bottom, ${campus.accent}99, ${campus.accent}00)`,
          }}
        />
      </div>
    </Html>
  );
}

function Campus({ campus, withLabel }: { campus: CampusEntry; withLabel: boolean }): React.JSX.Element {
  const pos = campusPosition(campus);
  const facing = campusFacing(campus);
  const labelY = MODEL_HEIGHT[campus.model] * campus.scale + 1.6;

  return (
    <group>
      <group position={pos} rotation={[0, facing, 0]} scale={campus.scale}>
        <CampusBuilding model={campus.model} />
      </group>
      {withLabel && <CampusLabel campus={campus} position={[pos[0], labelY, pos[2]]} />}
    </group>
  );
}

/** Orbit controls plus idle auto-rotation that yields to the user immediately. */
function CameraRig({ reducedMotion }: { reducedMotion: boolean }): React.JSX.Element {
  const { gl } = useThree();
  const [idle, setIdle] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useModifierGatedZoom(gl.domElement);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <OrbitControls
      domElement={gl.domElement}
      makeDefault
      target={TARGET}
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.055}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      autoRotate={idle && !reducedMotion}
      autoRotateSpeed={0.32}
      onStart={() => {
        clearTimeout(timer.current);
        setIdle(false);
      }}
      onEnd={() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setIdle(true), IDLE_BEFORE_AUTOROTATE_MS);
      }}
    />
  );
}

export function TokyoCampusScene({ showLabels }: { showLabels: boolean }): React.JSX.Element {
  const { tier, reducedMotion } = useQuality();
  const t: 'A' | 'B' = tier === 'A' ? 'A' : 'B';

  return (
    <group>
      <color attach="background" args={['#e9f0fa']} />
      <fog attach="fog" args={['#e9f0fa', 58, 196]} />

      {/* Clean daylight: one key light, soft sky/ground bounce, no shadow maps. */}
      <hemisphereLight args={['#ffffff', '#cdd8e8', 1.15]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[46, 72, 40]} intensity={1.15} color="#fffaf2" />
      <directionalLight position={[-40, 34, -26]} intensity={0.35} color="#cfe0ff" />

      <District tier={t} />

      {CAMPUSES.map((c) => (
        <Campus key={c.id} campus={c} withLabel={showLabels} />
      ))}

      <CameraRig reducedMotion={reducedMotion} />
    </group>
  );
}
