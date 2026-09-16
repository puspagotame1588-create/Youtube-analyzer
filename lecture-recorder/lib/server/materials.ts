import { promises as fs } from "fs";
import path from "path";
import { lecturePaths } from "./paths";
import { readMaterials } from "./store";

/** Extracts plain text from an uploaded file. Supports PDF and text formats. */
export async function extractText(file: string, bytes: Buffer): Promise<string> {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".pdf") return extractPdf(bytes);
  if ([".txt", ".md", ".csv", ".json", ".srt", ".vtt"].includes(ext)) {
    return bytes.toString("utf8");
  }
  throw new Error(
    "対応していない形式です。PDF またはテキスト（.txt / .md）でアップロードしてください。スライドは PDF に書き出してください。",
  );
}

async function extractPdf(bytes: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    verbosity: 0,
  });
  const doc = await loadingTask.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/[ \t]+/g, " ")
      .trim();
    if (text) pages.push(`【スライド ${i}】\n${text}`);
  }
  await loadingTask.destroy();
  return pages.join("\n\n");
}

/** Concatenated text of every material attached to a lecture, capped in size. */
export async function materialsContext(id: string, maxChars = 40000): Promise<string> {
  const index = await readMaterials(id);
  if (index.files.length === 0) return "";
  const dir = lecturePaths(id).materials;
  const parts: string[] = [];
  let used = 0;
  for (const file of index.files) {
    if (used >= maxChars) break;
    let text = "";
    try {
      text = await fs.readFile(path.join(dir, `${file.storedAs}.txt`), "utf8");
    } catch {
      continue;
    }
    const slice = text.slice(0, Math.max(0, maxChars - used));
    used += slice.length;
    parts.push(`----- 資料: ${file.name} -----\n${slice}`);
  }
  return parts.join("\n\n");
}
