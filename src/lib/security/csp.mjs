/**
 * Security response headers (shared by next.config.mjs and csp.test.ts).
 *
 * Two CSPs are emitted:
 *
 * 1. ENFORCED_CSP — conservative and safe to enforce now: it constrains
 *    base-uri, object-src, and frame-ancestors (base-tag hijack, plugins,
 *    clickjacking) but does NOT restrict script/style/connect/img, so the
 *    Three.js/WebGL scenes, fonts, blobs, and same-origin APIs are unaffected.
 *
 * 2. REPORT_ONLY_CSP — the precise *target* policy, shipped as
 *    Content-Security-Policy-Report-Only so it observes (never blocks). It is
 *    built from the app's real resource graph:
 *      - script/style 'unsafe-inline' (Next inline bootstrap + Tailwind/
 *        framer-motion inline styles) — the migration to a nonce-based
 *        script-src is a documented follow-up (needs middleware nonce wiring +
 *        verification against every 3D scene, and is safer after the Next.js
 *        CSP-nonce advisory GHSA-ffhc-5mcf-pf4q is resolved by upgrading Next).
 *      - img/font data: & blob: (inline SVG icons, generated textures).
 *      - worker 'self' blob: (Three.js / drei workers).
 *      - connect 'self' (all APIs are same-origin).
 *    Any third-party script, connect, frame, or object load will be REPORTED,
 *    surfacing regressions before enforcement. Do not enforce until every
 *    desktop/mobile 3D flow passes with zero legitimate violations.
 */

export const ENFORCED_CSP = "base-uri 'self'; object-src 'none'; frame-ancestors 'none'";

export const REPORT_ONLY_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
].join('; ');

export const securityHeaders = [
  { key: 'Content-Security-Policy', value: ENFORCED_CSP },
  { key: 'Content-Security-Policy-Report-Only', value: REPORT_ONLY_CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];
