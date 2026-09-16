"use client";

import nextDynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * The interactive screens are rendered in the browser only.
 *
 * Nothing here benefits from server rendering: every screen reads from the
 * local API after mount, and this app is never indexed. What server rendering
 * does add is a hydration step, where the browser must produce markup
 * identical to the server's. A page translator rewrites the text before that
 * comparison happens, which can take the whole page down with a client-side
 * exception. Skipping the server pass removes that failure entirely.
 */
function clientOnly<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  return nextDynamic(load, {
    ssr: false,
    loading: () => <p className="text-sm text-ink-soft">読み込み中…</p>,
  });
}

export const LibraryClient = clientOnly(() => import("./Library"));
export const RecorderClient = clientOnly(() => import("./Recorder"));
export const SettingsClient = clientOnly(() => import("./Settings"));
