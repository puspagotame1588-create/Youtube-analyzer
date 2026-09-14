"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { COURSE_COLORS, createCourse, db, deleteCourse } from "@/lib/db";
import { fmtDuration } from "@/lib/format";
import type { Course, Lecture } from "@/lib/types";
import StatusPill from "./StatusPill";

export default function Library() {
  const courses = useLiveQuery(() => db.courses.orderBy("createdAt").toArray(), []);
  const lectures = useLiveQuery(() => db.lectures.toArray(), []);
  const [showForm, setShowForm] = useState(false);

  if (!courses || !lectures) {
    return <p className="text-sm text-ink-soft">読み込み中… / Loading…</p>;
  }

  const byCourse = new Map<string, Lecture[]>();
  for (const l of lectures) {
    const arr = byCourse.get(l.courseId) ?? [];
    arr.push(l);
    byCourse.set(l.courseId, arr);
  }
  for (const arr of byCourse.values()) arr.sort((a, b) => b.number - a.number);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">ライブラリ</h1>
          <p className="text-sm text-ink-soft">
            科目ごとに講義を整理。Lectures organized by course and lecture number.
          </p>
        </div>
        <button className="btn-ghost" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "閉じる / Close" : "＋ 科目を追加 / Add course"}
        </button>
      </div>

      {showForm && (
        <CourseForm
          onDone={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {courses.length === 0 && !showForm && (
        <div className="card p-8 text-center">
          <p className="text-lg font-medium">まず科目を作成しましょう</p>
          <p className="mt-1 text-sm text-ink-soft">
            Create a course first (e.g. 経営学 — 田中先生). Then every recording is filed
            under it as 第1回, 第2回, …
          </p>
          <button className="btn-primary mt-4" onClick={() => setShowForm(true)}>
            ＋ 科目を追加 / Add course
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} lectures={byCourse.get(c.id) ?? []} />
        ))}
      </div>
    </div>
  );
}

function CourseForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createCourse({ name, teacher, color });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto_auto]">
      <label className="grid gap-1 text-xs text-ink-soft">
        科目名 / Course name
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: マーケティング論"
          required
          autoFocus
        />
      </label>
      <label className="grid gap-1 text-xs text-ink-soft">
        担当教員 / Teacher
        <input
          className="input"
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
          placeholder="例: 田中先生"
        />
      </label>
      <div className="grid gap-1 text-xs text-ink-soft">
        色 / Color
        <div className="flex items-center gap-1.5 py-1.5">
          {COURSE_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-ink" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
          保存 / Save
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  );
}

function CourseCard({ course, lectures }: { course: Course; lectures: Lecture[] }) {
  async function remove() {
    const ok = window.confirm(
      `「${course.name}」と ${lectures.length} 件の講義を削除しますか？\nDelete "${course.name}" and its ${lectures.length} lecture(s)? This cannot be undone.`,
    );
    if (ok) await deleteCourse(course.id);
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 inline-block h-3.5 w-3.5 flex-none rounded-full"
            style={{ background: course.color }}
            aria-hidden
          />
          <div>
            <h2 className="font-semibold leading-tight">{course.name}</h2>
            <p className="text-xs text-ink-soft">
              {course.teacher || "担当教員 未設定"} · {lectures.length} 回
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/record?courseId=${encodeURIComponent(course.id)}`}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            ● 録音
          </Link>
          <button
            className="text-xs text-ink-soft hover:text-danger"
            onClick={remove}
            title="Delete course"
          >
            削除
          </button>
        </div>
      </div>
      {lectures.length === 0 ? (
        <p className="p-4 text-sm text-ink-soft">
          まだ録音がありません。No recordings yet — tap 録音 to record 第1回.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {lectures.map((l) => (
            <li key={l.id}>
              <Link
                href={`/lecture/${l.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-2 text-ink-soft">第{l.number}回</span>
                    {l.title}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {l.date} · {fmtDuration(l.durationSec)}
                  </p>
                </div>
                <StatusPill status={l.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
