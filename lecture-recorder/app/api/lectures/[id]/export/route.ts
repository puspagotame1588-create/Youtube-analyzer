import { failFrom } from "@/lib/server/http";
import { buildMarkdown } from "@/lib/export";
import {
  readCourses,
  readFlashcards,
  readFlow,
  readHighlights,
  readLecture,
  readNotes,
  readTranscript,
} from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The whole lecture as one text file: transcript, notes, everything. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const lecture = await readLecture(id);
    if (!lecture) return new Response("講義が見つかりません", { status: 404 });
    const [courses, transcript, notes, flashcards, highlights, flow] = await Promise.all([
      readCourses(),
      readTranscript(id),
      readNotes(id),
      readFlashcards(id),
      readHighlights(id),
      readFlow(id),
    ]);
    const course = courses.find((c) => c.id === lecture.courseId);
    const markdown = buildMarkdown({
      lecture,
      course,
      transcript,
      notes,
      highlights,
      flashcards,
      flow,
    });
    const name = `${(course?.name ?? "lecture").replace(/[\\/:*?"<>|]+/g, "_")}_第${lecture.number}回_${lecture.date}.md`;
    return new Response(markdown, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      },
    });
  } catch (err) {
    return failFrom(err);
  }
}
