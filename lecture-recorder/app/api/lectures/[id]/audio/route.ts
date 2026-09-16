import { createReadStream, promises as fs } from "fs";
import { Readable } from "stream";
import { failFrom } from "@/lib/server/http";
import { lecturePaths } from "@/lib/server/paths";
import { readLecture } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Streams the saved master recording, with range support so seeking works. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const lecture = await readLecture(id);
    const file = lecturePaths(id).master;
    let size: number;
    try {
      size = (await fs.stat(file)).size;
    } catch {
      return new Response("音声ファイルがありません", { status: 404 });
    }
    const type = lecture?.audioMime || "audio/webm";
    const range = req.headers.get("range");

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match && match[1] ? Number(match[1]) : 0;
      const end = match && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
      if (Number.isNaN(start) || start >= size) {
        return new Response(null, {
          status: 416,
          headers: { "content-range": `bytes */${size}` },
        });
      }
      const stream = Readable.toWeb(
        createReadStream(file, { start, end }),
      ) as unknown as ReadableStream;
      return new Response(stream, {
        status: 206,
        headers: {
          "content-type": type,
          "content-length": String(end - start + 1),
          "content-range": `bytes ${start}-${end}/${size}`,
          "accept-ranges": "bytes",
        },
      });
    }

    const stream = Readable.toWeb(createReadStream(file)) as unknown as ReadableStream;
    return new Response(stream, {
      headers: {
        "content-type": type,
        "content-length": String(size),
        "accept-ranges": "bytes",
      },
    });
  } catch (err) {
    return failFrom(err);
  }
}
