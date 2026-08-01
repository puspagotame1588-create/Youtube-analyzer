# Hero backdrop plate

The hero scene is a **hybrid**: the near district (the six campuses, streets,
transit and planting) is real-time geometry, because the labels are anchored to
it and it has to respond to the orbit. Everything beyond it can be a
photographic plate — a single image wrapped on a large cylinder, giving the
horizon detail that procedural boxes never will, for one texture and one draw
call.

**The plate is off until you add an image.** With `src: null` the scene renders
its procedural horizon exactly as before.

## Adding your image

1. Drop the file here, e.g. `public/hero/backdrop.webp`.
2. In `src/components/three/campus/Backdrop.tsx`, set `BACKDROP.src` to
   `'/hero/backdrop.webp'`.
3. Set `skyColor` to the image's sky tone — it drives the scene background and
   the fog, so the plate and the mid-ground meet without a visible edge.
4. Match `light` to the image (see below). This is the step that decides
   whether the result works.

The procedural skyline switches itself off automatically when a plate is set,
so you never get two competing horizons.

## Image spec

| | |
|---|---|
| Format | WebP (preferred) or JPEG, sRGB |
| Wrapped panorama | ~4096 × 1024 (4:1), with `repeat: 3` |
| True 360° panorama | ~4096 × 2048 equirectangular, with `repeat: 1` |
| Target file size | under ~500 KB — it is a background, not the subject |
| Horizon position | roughly three-quarters of the way down the frame |

A single ~16:9 render works fine: at `repeat: 3` it wraps three times, and the
repeat is largely hidden behind the district and the haze. A true 360° panorama
is better if you have one — set `repeat: 1`.

If the horizon does not line up with the ground, nudge `centerY` (raise it to
push the horizon down) and `height`.

## Matching the lighting

Geometry lit for golden hour standing in front of a dusk photograph reads as a
collage immediately. Whatever you supply, set `BACKDROP.light` to match it:

- `keyColor` / `keyIntensity` — the sun's colour and strength in the image
- `keyPosition` — point it so the 3D shadows fall the same way as the shadows
  in the photograph
- `fillSky` / `fillGround` / `fillIntensity` — ambient bounce
- `exposure` — overall tone-mapping exposure

`DEFAULT_LIGHT` in `Backdrop.tsx` is the golden-hour preset used when no plate
is present, and is a reasonable starting point for a daylight image.

## Before you ship a photoreal plate

A photographic backdrop on a page that names six real universities can imply an
official relationship you may not have. Prefer a plate that is clearly a
rendering or is generic enough not to read as one specific institution's campus,
and make sure you hold the rights to whatever you commit here.
