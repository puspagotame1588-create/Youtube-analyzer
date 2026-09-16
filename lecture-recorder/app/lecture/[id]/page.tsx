import LectureViewClient from "@/components/LectureViewClient";

export const dynamic = "force-dynamic";

export default async function LecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LectureViewClient id={id} />;
}
