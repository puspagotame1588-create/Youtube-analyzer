"use client";

import nextDynamic from "next/dynamic";

/** Browser-only, for the reasons given in ClientOnly.tsx. */
const LectureView = nextDynamic(() => import("./LectureView"), {
  ssr: false,
  loading: () => <p className="text-sm text-ink-soft">読み込み中…</p>,
});

export default function LectureViewClient({ id }: { id: string }) {
  return <LectureView id={id} />;
}
