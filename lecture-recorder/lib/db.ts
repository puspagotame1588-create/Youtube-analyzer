"use client";

import Dexie, { type EntityTable } from "dexie";
import type { AudioRecord, Course, Lecture } from "./types";

class LectureDB extends Dexie {
  courses!: EntityTable<Course, "id">;
  lectures!: EntityTable<Lecture, "id">;
  audio!: EntityTable<AudioRecord, "lectureId">;

  constructor() {
    super("lecture-recorder");
    this.version(1).stores({
      courses: "id, name, createdAt",
      lectures: "id, courseId, number, date, createdAt, [courseId+number]",
      audio: "lectureId",
    });
  }
}

export const db = new LectureDB();

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const COURSE_COLORS = [
  "#4f46e5",
  "#0f766e",
  "#b45309",
  "#be185d",
  "#1d4ed8",
  "#15803d",
  "#7c3aed",
  "#c2410c",
];

export async function nextLectureNumber(courseId: string): Promise<number> {
  const last = await db.lectures
    .where("[courseId+number]")
    .between([courseId, Dexie.minKey], [courseId, Dexie.maxKey])
    .last();
  return (last?.number ?? 0) + 1;
}

export async function createCourse(input: {
  name: string;
  teacher: string;
  color?: string;
}): Promise<Course> {
  const count = await db.courses.count();
  const course: Course = {
    id: newId(),
    name: input.name.trim(),
    teacher: input.teacher.trim(),
    color: input.color ?? COURSE_COLORS[count % COURSE_COLORS.length],
    createdAt: Date.now(),
  };
  await db.courses.add(course);
  return course;
}

export async function deleteLecture(lectureId: string): Promise<void> {
  await db.transaction("rw", db.lectures, db.audio, async () => {
    await db.audio.delete(lectureId);
    await db.lectures.delete(lectureId);
  });
}

export async function deleteCourse(courseId: string): Promise<void> {
  await db.transaction("rw", db.courses, db.lectures, db.audio, async () => {
    const ids = await db.lectures.where("courseId").equals(courseId).primaryKeys();
    await db.audio.bulkDelete(ids);
    await db.lectures.bulkDelete(ids);
    await db.courses.delete(courseId);
  });
}
