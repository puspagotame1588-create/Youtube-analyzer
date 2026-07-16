"use client";

/**
 * Single source of truth for what actually happens to a form submission in
 * THIS deployment. Any page copy that describes storage or transmission must
 * derive from here — never hand-written per page — so the product cannot
 * contradict itself about where student data goes.
 *
 * Channels:
 *  - email:    /api/notify has Gmail SMTP configured → submissions are
 *              delivered to the MiraiPath team. `null` while still checking.
 *  - database: Supabase env vars are set → submissions are stored server-side.
 *  - local:    a copy is always kept in the browser so the student can
 *              review or delete it from the Privacy page.
 */
import { useEffect, useState } from "react";
import { supabaseConfigured } from "@/lib/store";

export interface SubmissionChannels {
  email: boolean | null;
  database: boolean;
  local: true;
}

export function useSubmissionChannels(): SubmissionChannels {
  const [email, setEmail] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notify", { method: "GET" })
      .then((res) => (res.ok ? res.json() : { configured: false }))
      .then((json: { configured?: boolean }) => {
        if (!cancelled) setEmail(Boolean(json?.configured));
      })
      .catch(() => {
        if (!cancelled) setEmail(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { email, database: supabaseConfigured(), local: true };
}

/** True once we know at least one channel actually transmits the submission. */
export function channelsDeliver(channels: SubmissionChannels): boolean {
  return channels.email === true || channels.database;
}
