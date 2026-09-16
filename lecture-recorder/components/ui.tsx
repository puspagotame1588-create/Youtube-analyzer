"use client";

import type { ReactNode } from "react";
import type { LectureStatus } from "@/lib/types";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`spinner inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

const STATUS: Record<LectureStatus, { text: string; cls: string }> = {
  recording: { text: "録音中", cls: "bg-danger-soft text-danger" },
  recorded: { text: "処理待ち", cls: "bg-surface-2 text-ink-soft" },
  transcribing: { text: "文字起こし中", cls: "bg-accent-soft text-accent" },
  analyzing: { text: "ノート作成中", cls: "bg-accent-soft text-accent" },
  done: { text: "完了", cls: "bg-ok-soft text-ok" },
  error: { text: "エラー", cls: "bg-danger-soft text-danger" },
};

export function StatusPill({ status }: { status: LectureStatus }) {
  const s = STATUS[status] ?? STATUS.recorded;
  const busy = status === "transcribing" || status === "analyzing";
  return (
    <span className={`pill ${s.cls}`}>
      {busy && <Spinner className="h-3 w-3" />}
      {s.text}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-soft">{hint}</span>}
    </label>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "error" | "ok";
  children: ReactNode;
}) {
  const cls = {
    info: "border-accent/30 bg-accent-soft text-ink",
    warn: "border-warn/30 bg-warn-soft text-ink",
    error: "border-danger/40 bg-danger-soft text-danger",
    ok: "border-ok/30 bg-ok-soft text-ink",
  }[tone];
  return (
    <div className={`rounded-lg border px-4 py-2.5 text-sm ${cls}`} role="status">
      {children}
    </div>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </div>
  );
}

export function Meter({ level, active }: { level: number; active: boolean }) {
  const pct = Math.min(100, Math.round(level * 220));
  const tone = !active ? "bg-line" : pct < 8 ? "bg-warn" : pct > 92 ? "bg-danger" : "bg-ok";
  return (
    <div className="flex items-center gap-2" title="入力レベル">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-[width] duration-75 ${tone}`}
          style={{ width: `${active ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}
