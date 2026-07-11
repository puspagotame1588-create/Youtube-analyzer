/**
 * Server configuration guard. Production fails CLOSED:
 * - no invite hashes configured → invite validation always rejects
 * - no/weak admin credential → admin login is disabled
 * Known defaults, example values, and short secrets are rejected everywhere.
 * Raw codes are never logged — only which check failed.
 */

const KNOWN_BAD_SECRETS = new Set(
  [
    'careerverse-admin',
    'kanto-beta',
    'admin',
    'administrator',
    'password',
    'passw0rd',
    'changeme',
    'change-me',
    'example',
    'secret',
    'test',
    'letmein',
    '12345678',
    '123456789',
    '1234567890',
    'qwertyuiop',
  ].map((s) => s.toLowerCase()),
);

export const isProduction = (): boolean =>
  process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

export interface SecretCheck {
  ok: boolean;
  reason?: 'missing' | 'too-short' | 'known-default' | 'low-entropy';
}

export function checkSecretStrength(value: string | undefined, minLength = 16): SecretCheck {
  if (!value || value.trim() === '') return { ok: false, reason: 'missing' };
  const v = value.trim();
  if (KNOWN_BAD_SECRETS.has(v.toLowerCase())) return { ok: false, reason: 'known-default' };
  if (v.length < minLength) return { ok: false, reason: 'too-short' };
  const classes =
    Number(/[a-z]/.test(v)) + Number(/[A-Z]/.test(v)) + Number(/[0-9]/.test(v)) + Number(/[^a-zA-Z0-9]/.test(v));
  if (classes < 2) return { ok: false, reason: 'low-entropy' };
  return { ok: true };
}

export interface ConfigStatus {
  production: boolean;
  inviteConfigured: boolean;
  adminConfigured: boolean;
  adminReason?: SecretCheck['reason'];
  kvMode: 'upstash' | 'supabase' | 'memory';
  supportDelivery: 'webhook' | 'resend' | 'postmark' | 'none';
  /** true when any production requirement is unmet (deployment is developer mode) */
  developerMode: boolean;
  issues: string[];
}

export function getConfigStatus(): ConfigStatus {
  const production = isProduction();
  const issues: string[] = [];

  const inviteConfigured = Boolean(process.env.INVITE_CODE_HASHES?.trim());
  if (!inviteConfigured) {
    issues.push(
      production
        ? 'INVITE_CODE_HASHES is not set — the invite gate FAILS CLOSED (no code is accepted).'
        : 'INVITE_CODE_HASHES is not set — dev mode requires it for the gate to open.',
    );
  }

  const adminCheck = checkSecretStrength(process.env.ADMIN_ACCESS_CODE);
  if (!adminCheck.ok) {
    issues.push(`ADMIN_ACCESS_CODE ${adminCheck.reason} — admin login is DISABLED until a strong secret is set.`);
  }

  const kvMode = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? 'upstash'
    : process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'supabase'
      : 'memory';
  if (kvMode === 'memory') {
    issues.push('No durable KV configured (Upstash/Supabase) — rate limits and invite use-counts are per-instance best-effort only.');
  }

  const supportDelivery = process.env.SUPPORT_WEBHOOK_URL
    ? 'webhook'
    : process.env.RESEND_API_KEY && process.env.SUPPORT_EMAIL_TO
      ? 'resend'
      : process.env.POSTMARK_SERVER_TOKEN && process.env.SUPPORT_EMAIL_TO
        ? 'postmark'
        : 'none';
  if (supportDelivery === 'none') {
    issues.push('No support delivery provider configured — tickets cannot be delivered to a team inbox.');
  }

  return {
    production,
    inviteConfigured,
    adminConfigured: adminCheck.ok,
    ...(adminCheck.reason ? { adminReason: adminCheck.reason } : {}),
    kvMode,
    supportDelivery,
    developerMode: !inviteConfigured || !adminCheck.ok || kvMode === 'memory' || supportDelivery === 'none',
    issues,
  };
}
