/**
 * Durable support-ticket record (system of record until an email provider is
 * added). Privacy properties (P0.1):
 *
 * - Retention: each full ticket is stored under its own key with a hard TTL and
 *   is auto-deleted by the backend at expiry (Redis EXPIRE). Default 30 days.
 * - Strict max size: the message is truncated to MAX_STORED_MESSAGE before
 *   storage (defence-in-depth on top of the API's 4000-char zod cap).
 * - Enumeration resistance: tickets are keyed by their random reference, not a
 *   sequential id, and the KV token is server-only (never in the browser).
 * - Status lifecycle: every record carries a `status` field.
 * - The full message body is NEVER written to logs (the API logs only metadata)
 *   and NEVER sent to the chat webhook (that gets a sanitized alert only).
 * - A future admin reader must render the message sanitized (see sanitizeForChat
 *   in delivery.ts) — no admin reader exists yet.
 */

import type { KVStore } from '@/lib/storage/kv';

export const SUPPORT_TICKET_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const MAX_STORED_MESSAGE = 4000;

export type SupportStatus = 'open' | 'answered' | 'closed';

export interface StoredSupportTicket {
  reference: string;
  category: string;
  message: string;
  email: string | null;
  locale: string;
  receivedAt: string;
  status: SupportStatus;
  deliveryProvider: string;
  deliveryStatus: string;
  deliveryError: string | null;
}

const ticketKey = (reference: string): string => `support:ticket:${reference}`;

/**
 * Persist the full ticket with a TTL. Returns true only when durably stored.
 * Skipped in memory mode (dev) — nothing durable to retain there.
 */
export async function storeFullTicket(
  kv: KVStore,
  input: Omit<StoredSupportTicket, 'status'> & { status?: SupportStatus },
): Promise<boolean> {
  if (kv.mode === 'memory') return false;
  const record: StoredSupportTicket = {
    ...input,
    message: input.message.slice(0, MAX_STORED_MESSAGE),
    status: input.status ?? 'open',
  };
  try {
    return await kv.setJson(ticketKey(record.reference), record, SUPPORT_TICKET_TTL_SECONDS);
  } catch {
    return false;
  }
}

/** Read one ticket by reference (server-side/admin use). Null if absent/expired. */
export async function readFullTicket(kv: KVStore, reference: string): Promise<StoredSupportTicket | null> {
  const doc = await kv.getJson(ticketKey(reference));
  return (doc as StoredSupportTicket | null) ?? null;
}
