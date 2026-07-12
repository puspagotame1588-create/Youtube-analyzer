import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Security response headers applied to every route.
 *
 * A deliberately conservative CSP: it sets `base-uri`, `object-src`, and
 * `frame-ancestors` (clickjacking + base-tag + plugin protection) but does NOT
 * constrain `script-src`/`connect-src`/`img-src`, so the Three.js/WebGL scenes,
 * fonts, blobs, and API calls are unaffected. A nonce-based `script-src` is a
 * recommended follow-up once it can be verified against the 3D scenes.
 */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['@react-three/drei', 'framer-motion'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
