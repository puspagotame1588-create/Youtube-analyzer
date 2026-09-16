import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "講義レコーダー",
  description:
    "日本語の大学講義を録音し、ライブ字幕・全文・要約・要点・用語・課題・試験予想・フラッシュカード・質問応答をまとめて作成します。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-[11px] leading-relaxed text-ink-soft">
          録音・音声・書き起こしはこのパソコンの中だけに保存されます。文字起こしと AI 生成のときだけ、音声とテキストが OpenAI に送信されます。
        </footer>
      </body>
    </html>
  );
}
