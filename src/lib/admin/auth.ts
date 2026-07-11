import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { checkSecretStrength } from '@/lib/config-guard';

/**
 * Server-side admin session helpers. FAIL-CLOSED: with no strong
 * ADMIN_ACCESS_CODE configured there is no valid token, so no cookie can
 * ever authenticate. The access code never reaches the client and is never
 * logged.
 */

export function expectedToken(): string | null {
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!checkSecretStrength(code).ok) return null;
  return createHash('sha256').update(`cv-admin:${code as string}`).digest('hex');
}

export function isAdmin(request: NextRequest): boolean {
  const token = expectedToken();
  if (!token) return false;
  return request.cookies.get('cv-admin')?.value === token;
}
