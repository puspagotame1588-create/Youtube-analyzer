import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import StatusBanner from "@/components/StatusBanner";

export const metadata: Metadata = {
  title: "講義レコーダー — Lecture Recorder",
  description:
    "Record Japanese university lectures with live Japanese + English transcription, then get a full transcript, summary and main points.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "講義レコーダー", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="inline-block h-6 w-6 rounded-md bg-accent" aria-hidden />
              <span className="whitespace-nowrap">
                講義レコーダー{" "}
                <span className="hidden font-normal text-ink-soft sm:inline">/ Lecture Recorder</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="btn-ghost whitespace-nowrap px-3 py-1.5">
                ライブラリ
              </Link>
              <Link href="/record" className="btn-primary whitespace-nowrap px-3 py-1.5">
                ● 録音
              </Link>
            </nav>
          </div>
        </header>
        <StatusBanner />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4 text-xs text-ink-soft">
          録音・文字起こしはこの端末のブラウザ内に保存されます。音声はAPIへ送信されるため、録音は先生の許可を得てから行ってください。
          <br />
          Recordings stay in this browser. Audio is sent to the transcription API, so ask your teacher for permission before recording.
        </footer>
      </body>
    </html>
  );
}
