import { promises as fs } from "fs";
import path from "path";
import {
  coursesFile,
  ensureDataDir,
  ensureLectureDirs,
  lecturePaths,
  lecturesDir,
  safeId,
} from "./paths";
import type {
  ChatTurn,
  Course,
  Flashcards,
  Lecture,
  LiveSegment,
  MaterialIndex,
  Notes,
  TranscriptFile,
} from "@/lib/types";

/** Writes JSON atomically so a crash mid-write cannot corrupt the file. */
async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function readCourses(): Promise<Course[]> {
  await ensureDataDir();
  return readJson<Course[]>(coursesFile(), []);
}

export async function writeCourses(courses: Course[]): Promise<void> {
  await writeJson(coursesFile(), courses);
}

export async function readLecture(id: string): Promise<Lecture | null> {
  return readJson<Lecture | null>(lecturePaths(id).meta, null);
}

export async function writeLecture(lecture: Lecture): Promise<void> {
  await ensureLectureDirs(lecture.id);
  await writeJson(lecturePaths(lecture.id).meta, lecture);
}

/** Read-modify-write of one lecture's metadata. Calls are serialized per lecture. */
const locks = new Map<string, Promise<unknown>>();

export function withLecture<T>(
  id: string,
  fn: (lecture: Lecture) => Promise<T> | T,
): Promise<T> {
  const previous = locks.get(id) ?? Promise.resolve();
  const next = previous.then(async () => {
    const lecture = await readLecture(id);
    if (!lecture) throw new Error("Lecture not found");
    return fn(lecture);
  });
  locks.set(
    id,
    next.catch(() => undefined),
  );
  return next;
}

export function patchLecture(
  id: string,
  patch: Partial<Lecture> | ((l: Lecture) => Partial<Lecture>),
): Promise<Lecture> {
  return withLecture(id, async (lecture) => {
    const delta = typeof patch === "function" ? patch(lecture) : patch;
    const updated: Lecture = { ...lecture, ...delta, updatedAt: Date.now() };
    await writeLecture(updated);
    return updated;
  });
}

export async function listLectures(): Promise<Lecture[]> {
  await ensureDataDir();
  let entries: string[] = [];
  try {
    entries = await fs.readdir(lecturesDir());
  } catch {
    return [];
  }
  const lectures = await Promise.all(
    entries.map(async (entry) => {
      try {
        return await readLecture(entry);
      } catch {
        return null;
      }
    }),
  );
  return lectures
    .filter((l): l is Lecture => Boolean(l))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteLecture(id: string): Promise<void> {
  await fs.rm(lecturePaths(id).base, { recursive: true, force: true });
}

/* ---------------------------------------------------------------- JSONL --- */

export async function appendLine(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, `${JSON.stringify(value)}\n`, "utf8");
}

export async function readLines<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const out: T[] = [];
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        out.push(JSON.parse(trimmed) as T);
      } catch {
        // A partially written final line (power loss) is skipped, not fatal.
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Live captions are appended as they arrive, so the newest state of a segment
 * is its last line. Returns one entry per index, ordered by index.
 */
export async function readLiveSegments(id: string): Promise<LiveSegment[]> {
  const lines = await readLines<LiveSegment>(lecturePaths(id).live);
  const byIdx = new Map<number, LiveSegment>();
  for (const line of lines) byIdx.set(line.idx, line);
  return [...byIdx.values()].sort((a, b) => a.idx - b.idx);
}

export function appendLiveSegment(id: string, seg: LiveSegment): Promise<void> {
  return appendLine(lecturePaths(id).live, seg);
}

export function readTranscript(id: string): Promise<TranscriptFile | null> {
  return readJson<TranscriptFile | null>(lecturePaths(id).transcript, null);
}

export function writeTranscript(id: string, value: TranscriptFile): Promise<void> {
  return writeJson(lecturePaths(id).transcript, value);
}

export function readNotes(id: string): Promise<Notes | null> {
  return readJson<Notes | null>(lecturePaths(id).notes, null);
}

export function writeNotes(id: string, value: Notes): Promise<void> {
  return writeJson(lecturePaths(id).notes, value);
}

export function readFlashcards(id: string): Promise<Flashcards | null> {
  return readJson<Flashcards | null>(lecturePaths(id).flashcards, null);
}

export function writeFlashcards(id: string, value: Flashcards): Promise<void> {
  return writeJson(lecturePaths(id).flashcards, value);
}

export function readChat(id: string): Promise<ChatTurn[]> {
  return readLines<ChatTurn>(lecturePaths(id).chat);
}

export function appendChat(id: string, turn: ChatTurn): Promise<void> {
  return appendLine(lecturePaths(id).chat, turn);
}

export function readMaterials(id: string): Promise<MaterialIndex> {
  return readJson<MaterialIndex>(lecturePaths(id).materialsIndex, { files: [] });
}

export function writeMaterials(id: string, value: MaterialIndex): Promise<void> {
  return writeJson(lecturePaths(id).materialsIndex, value);
}

/* ----------------------------------------------------------------- audio -- */

/** Serializes work per key, so concurrent appends cannot interleave. */
const chains = new Map<string, Promise<unknown>>();

export function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve();
  const next = previous.then(fn);
  chains.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

export async function appendMaster(id: string, bytes: Buffer): Promise<number> {
  return serialize(`master:${id}`, async () => {
    const p = lecturePaths(id);
    await fs.mkdir(p.audio, { recursive: true });
    await fs.appendFile(p.master, bytes);
    const stat = await fs.stat(p.master);
    return stat.size;
  });
}

export async function saveChunk(
  id: string,
  kind: "live" | "pass",
  idx: number,
  bytes: Buffer,
  ext: string,
): Promise<string> {
  const p = lecturePaths(id);
  const dir = kind === "live" ? p.liveChunks : p.passChunks;
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${String(idx).padStart(5, "0")}.${ext}`);
  await fs.writeFile(file, bytes);
  return file;
}

export interface PassChunkEntry {
  idx: number;
  startSec: number;
  endSec: number;
}

/** Records where a pass chunk sits in the lecture, as measured while recording. */
export async function recordPassChunk(id: string, entry: PassChunkEntry): Promise<void> {
  await serialize(`passindex:${id}`, async () => {
    const file = path.join(lecturePaths(id).passChunks, "index.json");
    const current = await readJson<PassChunkEntry[]>(file, []);
    const next = [...current.filter((e) => e.idx !== entry.idx), entry].sort(
      (a, b) => a.idx - b.idx,
    );
    await writeJson(file, next);
  });
}

export function readPassIndex(id: string): Promise<PassChunkEntry[]> {
  return readJson<PassChunkEntry[]>(
    path.join(lecturePaths(id).passChunks, "index.json"),
    [],
  );
}

export async function listChunks(id: string, kind: "live" | "pass"): Promise<string[]> {
  const p = lecturePaths(id);
  const dir = kind === "live" ? p.liveChunks : p.passChunks;
  try {
    const names = await fs.readdir(dir);
    return names
      .filter((n) => !n.endsWith(".tmp") && n !== "index.json")
      .sort()
      .map((n) => path.join(dir, n));
  } catch {
    return [];
  }
}

/** After a successful accurate pass the working chunks are no longer needed. */
export async function removeWorkingChunks(id: string): Promise<void> {
  const p = lecturePaths(id);
  await fs.rm(p.liveChunks, { recursive: true, force: true });
  await fs.rm(p.passChunks, { recursive: true, force: true });
}

export async function dirSize(dir: string): Promise<number> {
  let total = 0;
  const walk = async (current: string) => {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else {
        try {
          total += (await fs.stat(full)).size;
        } catch {
          /* file vanished */
        }
      }
    }
  };
  await walk(dir);
  return total;
}

export { safeId };
