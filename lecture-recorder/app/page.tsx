import ClientOnly from "@/components/ClientOnly";
import Library from "@/components/Library";

export default function HomePage() {
  return (
    <ClientOnly fallback={<p className="text-sm text-ink-soft">読み込み中… / Loading…</p>}>
      <Library />
    </ClientOnly>
  );
}
