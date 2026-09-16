import { promises as fs } from "fs";
import path from "path";
import { fail, failFrom, newId, ok } from "@/lib/server/http";
import { extractText } from "@/lib/server/materials";
import { lecturePaths } from "@/lib/server/paths";
import { ensureLectureDirs } from "@/lib/server/paths";
import { readMaterials, writeMaterials } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

const MAX_BYTES = 40 * 1024 * 1024;

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok((await readMaterials(id)).files);
  } catch (err) {
    return failFrom(err);
  }
}

/** Slides and notes uploaded here are used as grounding for notes and chat. */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return fail("ファイルがありません");
    if (file.size > MAX_BYTES) return fail("ファイルが大きすぎます（40MB まで）");

    await ensureLectureDirs(id);
    const bytes = Buffer.from(await file.arrayBuffer());
    const text = await extractText(file.name, bytes);
    if (!text.trim()) {
      return fail(
        "文字を取り出せませんでした。画像だけの PDF は読み取れません。テキスト付きの PDF を使ってください。",
      );
    }

    const storedAs = newId();
    const dir = lecturePaths(id).materials;
    await fs.writeFile(path.join(dir, `${storedAs}${path.extname(file.name)}`), bytes);
    await fs.writeFile(path.join(dir, `${storedAs}.txt`), text, "utf8");

    const index = await readMaterials(id);
    const entry = {
      name: file.name,
      storedAs,
      bytes: file.size,
      chars: text.length,
      addedAt: Date.now(),
    };
    index.files.push(entry);
    await writeMaterials(id, index);
    return ok(entry);
  } catch (err) {
    return failFrom(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const storedAs = new URL(req.url).searchParams.get("storedAs") ?? "";
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(storedAs)) return fail("ファイル ID が不正です");
    const index = await readMaterials(id);
    const entry = index.files.find((f) => f.storedAs === storedAs);
    if (!entry) return fail("ファイルが見つかりません", 404);
    const dir = lecturePaths(id).materials;
    await fs.rm(path.join(dir, `${storedAs}${path.extname(entry.name)}`), { force: true });
    await fs.rm(path.join(dir, `${storedAs}.txt`), { force: true });
    index.files = index.files.filter((f) => f.storedAs !== storedAs);
    await writeMaterials(id, index);
    return ok({ deleted: true });
  } catch (err) {
    return failFrom(err);
  }
}
