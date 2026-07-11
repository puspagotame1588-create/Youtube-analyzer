/**
 * Deployment health/config status. Never leaks secrets — reports only which
 * capabilities are configured and whether the deployment is in developer mode
 * (i.e. strict limits and delivery are NOT fully enforced).
 */

import { NextResponse } from 'next/server';
import { getConfigStatus } from '@/lib/config-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const s = getConfigStatus();
  return NextResponse.json({
    ok: true,
    production: s.production,
    developerMode: s.developerMode,
    invite: s.inviteConfigured ? 'configured' : 'fail-closed (not configured)',
    admin: s.adminConfigured ? 'configured' : `disabled (${s.adminReason ?? 'not configured'})`,
    kv: s.kvMode,
    supportDelivery: s.supportDelivery,
    issues: s.issues,
  });
}
