"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtDuration } from "@/lib/export";
import type { Course, Lecture } from "@/lib/types";
import { Empty, Field, Notice, Spinner, StatusPill } from "./ui";

export default function Library() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, l] = await Promise.all([api.courses(), api.lectures()]);
      setCourses(c);
      setLectures(l);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    void load();
    // Keeps the list live while a lecture is being transcribed in the background.
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const byCourse = useMemo(() => {
    const map = new Map<string, Lecture[]>();
    for (const lecture of lectures) {
      const list = map.get(lecture.courseId) ?? [];
      list.push(lecture);
      map.set(lecture.courseId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.date === b.date ? b.number - a.number : b.date.localeCompare(a.date)));
    }
    return map;
  }, [lectures]);

  if (!courses) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Spinner /> 読み込み中…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">ライブラリ</h1>
          <p className="mt-0.5 text-sm text-ink-soft">科目ごと・日付順に整理されています。</p>
        </div>
        <button className="btn-ghost" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "閉じる" : "＋ 科目を追加"}
        </button>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {showForm && (
        <CourseForm
          onSaved={async () => {
            setShowForm(false);
            await load();
          }}
        />
      )}

      {courses.length === 0 && !showForm && (
        <Empty
          title="まず科目を作りましょう"
          body="例:「マーケティング論 / 田中先生」。作成すると、録音は第1回・第2回…と自動で整理されます。"
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            lectures={byCourse.get(course.id) ?? []}
            onChanged={load}
          />
        ))}
      </div>
    </div>
  );
}

function CourseForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createCourse({
        name,
        teacher,
        language,
        keywords: keywords.split(/[,、\n]/).map((k) => k.trim()).filter(Boolean),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="科目名">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="マーケティング論"
            required
            autoFocus
          />
        </Field>
        <Field label="担当教員">
          <input
            className="input"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            placeholder="田中先生"
          />
        </Field>
        <Field label="講義の言語">
          <select
            className="select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "ja" | "en")}
          >
            <option value="ja">日本語</option>
            <option value="en">英語</option>
          </select>
        </Field>
      </div>
      <Field
        label="専門用語（任意・読み取り精度が上がります）"
        hint="読点・カンマ・改行で区切ります。例: 知覚価値、STP、セグメンテーション、限界効用"
      >
        <textarea
          className="input min-h-20"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="知覚価値、STP、4P、限界効用"
        />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy || !name.trim()}>
          {busy && <Spinner />} 保存
        </button>
      </div>
    </form>
  );
}

function CourseCard({
  course,
  lectures,
  onChanged,
}: {
  course: Course;
  lectures: Lecture[];
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [keywords, setKeywords] = useState(course.keywords.join("、"));
  const [busy, setBusy] = useState(false);

  async function saveKeywords() {
    setBusy(true);
    try {
      await api.updateCourse(course.id, {
        keywords: keywords.split(/[,、\n]/).map((k) => k.trim()).filter(Boolean),
      });
      setEditing(false);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = window.confirm(
      `「${course.name}」と、その ${lectures.length} 件の講義（音声を含む）を削除します。元に戻せません。`,
    );
    if (!ok) return;
    await api.deleteCourse(course.id);
    await onChanged();
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-1.5 h-3 w-3 flex-none rounded-full"
            style={{ background: course.color }}
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="truncate font-semibold">{course.name}</h2>
            <p className="text-xs text-ink-soft">
              {course.teacher || "担当未設定"} ・ {lectures.length} 回 ・{" "}
              {course.language === "ja" ? "日本語" : "英語"}
            </p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Link
            href={`/record?courseId=${encodeURIComponent(course.id)}`}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            録音
          </Link>
          <button className="btn-quiet px-2 py-1.5 text-xs" onClick={() => setEditing((v) => !v)}>
            用語
          </button>
          <button className="btn-quiet px-2 py-1.5 text-xs" onClick={remove}>
            削除
          </button>
        </div>
      </div>

      {editing && (
        <div className="space-y-2 border-b border-line bg-surface-2/50 p-4">
          <Field
            label="専門用語"
            hint="ここに入れた語は音声認識のヒントとして使われ、表記も統一されます。"
          >
            <textarea
              className="input min-h-20"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </Field>
          <button className="btn-primary text-xs" onClick={saveKeywords} disabled={busy}>
            {busy && <Spinner />} 保存
          </button>
        </div>
      )}

      {lectures.length === 0 ? (
        <p className="p-4 text-sm text-ink-soft">まだ録音がありません。</p>
      ) : (
        <ul className="divide-y divide-line">
          {lectures.map((lecture) => (
            <li key={lecture.id}>
              <Link
                href={`/lecture/${lecture.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-2 text-ink-soft">第{lecture.number}回</span>
                    {lecture.title || "（無題）"}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {lecture.date} ・ {fmtDuration(lecture.durationSec)}
                    {lecture.progress
                      ? ` ・ ${lecture.progress.step} ${lecture.progress.done}/${lecture.progress.total}`
                      : ""}
                  </p>
                </div>
                <StatusPill status={lecture.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
