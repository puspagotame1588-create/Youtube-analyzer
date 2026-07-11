/**
 * Build/deployment identity. commitSha/branch/buildTime come from
 * src/build-info.json, which the Vercel install step overwrites via
 * `git rev-parse HEAD` at build time (NOT typed by hand). environment and
 * deploymentId come from Vercel system env at runtime. No secrets exposed.
 */

import { NextResponse } from 'next/server';
import buildInfo from '@/build-info.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    commitSha: buildInfo.commitSha,
    branch: buildInfo.branch,
    buildTime: buildInfo.buildTime,
    deploymentId:
      process.env.VERCEL_DEPLOYMENT_ID ??
      process.env.VERCEL_URL ??
      'unknown',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    region: process.env.VERCEL_REGION ?? null,
  });
}
