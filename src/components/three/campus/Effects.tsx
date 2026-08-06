'use client';

/**
 * Post-processing for the hero scene. Tier A only, and code-split — tier B
 * never downloads the postprocessing bundle at all.
 *
 * The whole pass is tuned so that the ONLY things that glow are the accents.
 * Bloom's luminance threshold sits at 0.9, well above the brightest surface in
 * the scene: the context tier tops out around 0.8 after tone mapping, and the
 * landmark emissive is a dark indigo whose luminance is nowhere near the
 * threshold. What clears 0.9 is the additive beacon core and the specular
 * hits on the landmark glazing — which is exactly the intended list.
 *
 * SMAA rather than MSAA: the composer renders to its own buffer, so the canvas
 * `antialias` flag would be paid for and then discarded. `multisampling={0}`
 * makes that explicit.
 */

import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export function HeroEffects(): React.JSX.Element {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.05}
        intensity={0.15}
        mipmapBlur
        /* Half-res bloom. At threshold 0.9 and intensity 0.15 the pass is a
           faint halo around a handful of pixels — there is nothing in it that
           full resolution resolves and half does not, and bloom is pure fill
           rate, which is the most expensive thing in this scene. */
        resolutionScale={0.5}
      />
      <SMAA />
      {/* Deliberately weak. At darkness 0.42 the corners read as a lens effect,
          which is a photographic cue and the opposite of "instrument". This is
          just enough to stop the frame edges from floating. */}
      <Vignette offset={0.42} darkness={0.22} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

export default HeroEffects;
