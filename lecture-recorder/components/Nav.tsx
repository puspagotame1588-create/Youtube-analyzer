"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "ライブラリ" },
  { href: "/import", label: "音声を読み込む" },
  { href: "/settings", label: "設定" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-ink">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 12a7 7 0 0 0 14 0M12 19v3" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-semibold">講義レコーダー</span>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 transition ${
                  active ? "bg-surface-2 font-medium text-ink" : "text-ink-soft hover:bg-surface-2"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/record" className="btn-primary px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
            録音する
          </Link>
        </nav>
      </div>
    </header>
  );
}
