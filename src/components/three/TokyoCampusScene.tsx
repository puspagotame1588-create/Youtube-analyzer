'use client';

/**
 * The CareerVerse hero scene — a semi-realistic model of a Tokyo academic
 * district, lit as an architectural visualisation rather than a game level.
 *
 * The campuses are STYLISED VISUAL REPRESENTATIONS inspired by each university's
 * best-known landmark. They are not architectural reproductions, and nothing in
 * this scene is derived from licensed or surveyed building data.
 *
 * Lighting is a single low golden-hour key with a cool sky fill, ACES tone
 * mapping, soft shadow maps and a baked contact-shadow pass for ambient
 * grounding. Depth comes from graded haze rather than a post-processing blur —
 * see the note on ContactShadows/DoF below.
 *
 * Camera: orbit-only (no pan) so the hero card always sits over the district
 * centre and stays readable from every permitted angle. Distance and polar
 * limits are chosen so the camera can never reach a building's footprint.
 */

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, OrbitControls } from '@react-three/drei';
import { useQuality } from '@/lib/store/quality';
import { CAMPUSES, campusFacing, campusPosition, type CampusEntry } from './campus/data';
import { CampusBuilding, MODEL_HEIGHT } from './campus/Buildings';
import { District } from './campus/District';
import { BACKDROP, Backdrop, backdropEnabled } from './campus/Backdrop';
import { LandmarkBeacons, LandmarkEdges, type BeaconSpec } from './campus/Accents';
import { ACCENTS } from './campus/look';

/**
 * Post-processing is code-split: tier B and below never download it. `ssr:false`
 * because it touches WebGL on import.
 */
const HeroEffects = dynamic(() => import('./campus/Effects').then((m) => m.HeroEffects), {
  ssr: false,
});

/**
 * Framing: a model on a table, not a street — now inside a 56%-wide canvas.
 *
 * The district reads to a radius of about 55 world units (campus ring at ~34,
 * urban fabric to 52, transit viaduct at 45). At a 32° vertical FOV the frame's
 * half-extent is d·tan(16°), and a disc of radius R seen at elevation θ projects
 * to a vertical half-extent of R·sin(θ).
 *
 * The canvas is 56% of the viewport but full hero height, so its aspect is only
 * about 1.06 — nearly square. A circular footprint in a near-square frame is
 * WIDTH-limited, which sets the distance:
 *
 *   horizontal  d·tan(16°)·aspect > R
 *   vertical    fill = R·sin(θ) / (d·tan(16°))
 *
 * Substituting the horizontal limit into the vertical expression collapses R
 * out of it entirely:
 *
 *   fill = aspect · sin(θ)
 *
 * So at the tightest horizontal fit the vertical fill depends only on elevation,
 * and the ~70% target lands at θ ≈ 41°, independent of how big the district is.
 * d = 196 backs off from that limit far enough to leave ~8% horizontal margin,
 * which costs a few points of fill (~64%).
 *
 * R is taken as the district disc (~55). The transit viaduct reaches ~74 and is
 * allowed to run off one corner: it is context scenery routed deliberately
 * outside the district, and framing for it would push the camera past 260 units
 * and shrink the landmarks for no gain.
 *
 * MAX_POLAR is the constraint that keeps this a planning table: at 1.2 rad the
 * camera is still 21° above the ground, so it can never drop to street level.
 * At MIN_DISTANCE the camera's ground radius is 120·cos(21°) ≈ 112 — well
 * outside the outermost footprint, so no orbit can put it inside a building.
 */
const TARGET = new THREE.Vector3(0, 5, 0);
const MIN_DISTANCE = 140;
const MAX_DISTANCE = 260;
const MAX_POLAR = 1.2; // ≥21° above the horizon at all times
const MIN_POLAR = 0.5; // ≤62°, short of a plan view
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
 * Pins the colour pipeline for this scene.
 *
 * react-three-fiber already applies ACES + sRGB when `flat` is false, so this is
 * belt-and-braces rather than new behaviour — but the hero's whole look is
 * calibrated against this curve, and inheriting it from a library default means
 * an r3f upgrade could regrade the scene silently. Setting it here makes the
 * dependency explicit and greppable.
 */
function RenderPipeline(): null {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = BACKDROP.light.exposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);
  return null;
}

/**
 * Campus label: a minimal white glass card, English over Japanese, on a hairline
 * leader down to the roof. No accent dot or colour coding — a coloured pip is
 * the kind of detail that reads as a game HUD rather than a considered map.
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
    // There is no longer a glass card over the canvas, so a label only needs to
    // stay inside the canvas. The margins are generous because the label is a
    // DOM box centred on this point and roughly 190x54px — anchoring it at the
    // very edge would push half of it outside the canvas and let it overlap the
    // copy column.
    const inFrame =
      ndc.z < 1 && Math.abs(ndc.x) < 0.82 && ndc.y < 0.84 && ndc.y > -0.78;
    const next = inFrame;
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
      <div ref={ref} style={{ transition: 'opacity 300ms ease', willChange: 'opacity' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 10px 30px rgba(27,35,64,0.14), 0 1px 2px rgba(27,35,64,0.06)',
            color: '#1B2340',
            borderRadius: 10,
            padding: '8px 14px',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {campus.nameEn}
          </div>
          <div style={{ fontSize: 11, color: '#5A6384', marginTop: 1 }}>{campus.nameJa}</div>
        </div>
        <div
          aria-hidden="true"
          style={{
            width: 1,
            height: 30,
            margin: '0 auto',
            background: 'linear-gradient(to bottom, rgba(27,35,64,0.34), rgba(27,35,64,0))',
          }}
        />
      </div>
    </Html>
  );
}

const roofHeight = (c: CampusEntry): number => MODEL_HEIGHT[c.model] * c.scale;

/** Column bases, computed once — the campuses never move. */
const BEACONS: BeaconSpec[] = CAMPUSES.map((c) => {
  const [x, , z] = campusPosition(c);
  return { position: [x, roofHeight(c) + 0.6, z] as [number, number, number], height: 26 };
});

/** Every campus's massing, in one group so their edges can be merged as one. */
function CampusMassing(): React.JSX.Element {
  return (
    <group>
      {CAMPUSES.map((c) => (
        <group
          key={c.id}
          position={campusPosition(c)}
          rotation={[0, campusFacing(c), 0]}
          scale={c.scale}
        >
          <CampusBuilding model={c.model} />
        </group>
      ))}
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
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.7}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      autoRotate={idle && !reducedMotion}
      autoRotateSpeed={0.3}
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

/** Low golden-hour key with a shadow frustum sized to the district. */
function KeyLight({ tier }: { tier: 'A' | 'B' }): React.JSX.Element {
  const ref = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    const l = ref.current;
    if (!l) return;
    // Frustum covers the district disc (radius ~55) with headroom; `far` clears
    // the light's own distance from origin (~140) plus the far side of the disc.
    l.shadow.camera.left = -82;
    l.shadow.camera.right = 82;
    l.shadow.camera.top = 82;
    l.shadow.camera.bottom = -82;
    l.shadow.camera.near = 10;
    // Clears the light's own distance from origin (~188) plus the far side.
    l.shadow.camera.far = 300;
    l.shadow.bias = -0.0006;
    l.shadow.normalBias = 0.035;
    l.shadow.camera.updateProjectionMatrix();
  }, []);

  return (
    <directionalLight
      ref={ref}
      position={BACKDROP.light.keyPosition}
      intensity={BACKDROP.light.keyIntensity}
      color={BACKDROP.light.keyColor}
      castShadow={tier === 'A'}
      shadow-mapSize-width={1536}
      shadow-mapSize-height={1536}
    />
  );
}

export function TokyoCampusScene({ showLabels }: { showLabels: boolean }): React.JSX.Element {
  const { tier, reducedMotion } = useQuality();
  const t: 'A' | 'B' = tier === 'A' ? 'A' : 'B';
  // Both accent families are tier-A only and individually switchable in ./look.
  const accents = t === 'A' && ACCENTS.beacons;
  const bloom = t === 'A' && ACCENTS.bloom;
  // With a photographic plate the procedural skyline is redundant — it would
  // sit in front of a better horizon and read as a second, worse one.
  const plate = backdropEnabled(BACKDROP);

  return (
    <group>
      <color attach="background" args={[BACKDROP.skyColor]} />
      {/* Graded haze does the depth separation a depth-of-field pass would, at no
          per-frame cost — and the hero card's own backdrop blur already supplies
          the near-field focus effect DoF would be bought for. */}
      {/* Far plane extended for the pulled-back camera. The skyline ring ends at
          radius 320, which from the new camera distance is ~418 away — past the
          far plane, so it has already dissolved into the background colour and
          leaves no hard edge. The district's back rows pick up ~30% haze on the
          way, which is the aerial perspective that separates fore from back. */}
      <fog attach="fog" args={[BACKDROP.skyColor, 95, plate ? 232 : 330]} />

      <RenderPipeline />

      {/* Sky/ground bounce, a warm low key, and a cool counter-fill. */}
      <hemisphereLight
        args={[BACKDROP.light.fillSky, BACKDROP.light.fillGround, BACKDROP.light.fillIntensity]}
      />
      <KeyLight tier={t} />
      <directionalLight position={[-56, 26, -40]} intensity={0.45} color="#a9c4ee" />

      {/* Small procedural environment, kept deliberately dim. It exists to give
          glass and metal something plausible to reflect — pushed brighter it acts
          as a full IBL fill, which flattens the key light's shadow-side contrast
          and is what makes a PBR scene read washed out. Rendered once. */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={0.5} color="#fff0d6" position={[8, 5, 2]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.18} color="#cfe0ff" position={[-8, 3, -4]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.28} color="#ffffff" position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 14, 1]} />
      </Environment>

      <Backdrop />
      <District tier={t} plate={plate} />

      {accents ? (
        <LandmarkEdges>
          <CampusMassing />
        </LandmarkEdges>
      ) : (
        <CampusMassing />
      )}

      {accents && <LandmarkBeacons beacons={BEACONS} />}

      {showLabels &&
        CAMPUSES.map((c) => {
          const [x, , z] = campusPosition(c);
          return (
            <CampusLabel key={c.id} campus={c} position={[x, roofHeight(c) + 1.8, z]} />
          );
        })}

      {/* Ambient grounding. frames={1} bakes it once — the geometry never moves,
          so this is a one-off cost that reads like soft ambient occlusion. */}
      {!reducedMotion && (
        <ContactShadows
          position={[0, 0.06, 0]}
          scale={150}
          resolution={t === 'A' ? 1024 : 512}
          far={16}
          blur={2.5}
          opacity={0.35}
          color="#2b3350"
          frames={1}
        />
      )}

      <CameraRig reducedMotion={reducedMotion} />

      {bloom && <HeroEffects />}
    </group>
  );
}
