import type { LectureStatus } from "@/lib/types";

const LABELS: Record<LectureStatus, { text: string; cls: string }> = {
  recording: { text: "録音中 / recording", cls: "bg-danger-soft text-danger" },
  recorded: { text: "未分析 / not analyzed", cls: "bg-surface-2 text-ink-soft" },
  analyzing: { text: "分析中 / analyzing", cls: "bg-accent-soft text-accent" },
  done: { text: "完了 / done", cls: "bg-ja-soft text-ja" },
  error: { text: "エラー / error", cls: "bg-danger-soft text-danger" },
};

export default function StatusPill({ status }: { status: LectureStatus }) {
  const l = LABELS[status];
  return <span className={`pill ${l.cls}`}>{l.text}</span>;
}
