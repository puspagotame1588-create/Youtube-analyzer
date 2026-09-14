import ClientOnly from "@/components/ClientOnly";
import LectureDetail from "@/components/LectureDetail";

export default async function LecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ClientOnly fallback={<p className="text-sm text-ink-soft">読み込み中… / Loading…</p>}>
      <LectureDetail id={id} />
    </ClientOnly>
  );
}
