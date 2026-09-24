"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type FlowState } from "@/lib/api";
import { resolveCitations } from "@/lib/flow";
import { fmtSec } from "@/lib/export";
import type {
  EvidenceText,
  FlowDetailKind,
  FlowSection,
  LectureFlow as Flow,
  TranscriptSegment,
} from "@/lib/types";
import { Empty, Notice, Spinner } from "./ui";

const STAGE_LABEL: Record<string, string> = {
  reading: "書き起こしを読み込み中",
  topics: "話題を見つけています",
  connecting: "説明をつないでいます",
  coverage: "取りこぼしを確認しています",
};

const DETAIL_LABEL: Record<FlowDetailKind, string> = {
  definition: "定義",
  reasoning: "理由",
  example: "例",
  calculation: "計算",
  qualification: "留保",
  student_question: "学生の質問",
};

const RELATION_LABEL: Record<string, string> = {
  next_topic: "次の話題",
  prerequisite: "前提",
  example_of: "例",
  contrast: "対比",
  cause: "原因",
  return_to_topic: "話題への回帰",
};

/** How a sentence got here. Never let an AI explanation read as a quotation. */
const BASIS_NOTE: Record<EvidenceText["basis"], string | null> = {
  transcript: null,
  derived_calculation: "講義の数値からの計算",
  ai_explanation: "AI による補足",
};

export default function LectureFlowPanel({
  id,
  segments,
  canSeek,
  onSeek,
}: {
  id: string;
  segments: TranscriptSegment[];
  canSeek: boolean;
  onSeek: (sec: number) => void;
}) {
  const [state, setState] = useState<FlowState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const chose = useRef(false);

  const load = useCallback(async () => {
    try {
      const next = await api.flow(id);
      setState(next);
      // Follow the stored flow's language until the student picks one.
      if (!chose.current && next.flow) setLanguage(next.flow.outputLanguage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // While a run is going, follow it. The interval stops as soon as it is not.
  const running = state?.running ?? false;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => void load(), 2000);
    return () => window.clearInterval(timer);
  }, [running, load]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      await api.startFlow(id, language);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      await api.cancelFlow(id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Spinner /> 読み込み中…
      </p>
    );
  }

  const { flow, job } = state;
  const allIds = flow ? flow.sections.map((s) => s.id) : [];
  const toggle = (sectionId: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="section-title">講義の流れ</h2>
            <p className="mt-1 text-sm text-ink-soft">
              先生が何を説明しようとしていたのか、話がどうつながって結論に至るのかを、
              書き起こしに基づいて順番に読めるようにします。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-ink-soft">
              出力の言語
              <select
                className="select ml-1.5 py-1 text-xs"
                value={language}
                onChange={(e) => {
                  chose.current = true;
                  setLanguage(e.target.value as "ja" | "en");
                }}
                disabled={state.running}
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </label>
            {state.running ? (
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={cancel} disabled={busy}>
                中止する
              </button>
            ) : (
              <button
                className="btn-primary px-3 py-1.5 text-xs"
                onClick={generate}
                disabled={busy || !state.hasTranscript}
              >
                {busy && <Spinner />} {flow ? "作り直す" : "作成する"}
              </button>
            )}
          </div>
        </div>

        {state.running && job && (
          <div className="mt-3">
            <p className="flex items-center gap-2 text-sm">
              <Spinner />
              {STAGE_LABEL[job.stage] ?? "処理中"}
              {job.total > 1 && (
                <span className="text-ink-soft">
                  （{job.done} / {job.total}）
                </span>
              )}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${job.total ? (job.done / job.total) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              この画面は閉じても処理は続きます。長い講義では数分かかります。
            </p>
          </div>
        )}
      </section>

      {!state.hasTranscript && (
        <Notice tone="warn">先に文字起こしを完了してください。</Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {!state.running && job?.status === "error" && job.error && (
        <Notice tone="error">
          前回の作成に失敗しました: {job.error}
          {flow && "（以前の結果をそのまま表示しています）"}
        </Notice>
      )}
      {!state.running && job?.status === "cancelled" && (
        <Notice tone="warn">
          作成を中止しました。{flow && "以前の結果をそのまま表示しています。"}
        </Notice>
      )}
      {state.outdated && (
        <Notice tone="warn">
          書き起こしが作り直されたため、この内容は古くなっています。引用箇所がずれている可能性があります。
          「作り直す」で最新の書き起こしから作成してください。
        </Notice>
      )}
      {flow?.availability === "partial" && (
        <Notice tone="warn">
          一部の区間を処理できていません。下の「取りこぼしの確認」をご覧ください。
        </Notice>
      )}

      {!flow ? (
        <Empty
          title={state.running ? "作成しています…" : "まだ作成していません"}
          body={
            state.running
              ? "完了するとここに講義全体の流れが表示されます。"
              : "「作成する」を押すと、書き起こしから講義の流れを組み立てます。"
          }
        />
      ) : (
        <>
          <BigPicture flow={flow} segments={segments} canSeek={canSeek} onSeek={onSeek} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="section-title">くわしい流れ</h3>
            <div className="flex gap-1.5 text-xs">
              <button className="btn-ghost px-2.5 py-1" onClick={() => setOpen(new Set(allIds))}>
                すべて開く
              </button>
              <button className="btn-ghost px-2.5 py-1" onClick={() => setOpen(new Set())}>
                すべて閉じる
              </button>
            </div>
          </div>

          {flow.chapters.map((chapter) => (
            <section key={chapter.id} className="space-y-3">
              <h4 className="pill border border-line bg-surface-2 text-ink-soft">
                {chapter.title}
              </h4>
              {chapter.sectionIds.map((sectionId) => {
                const section = flow.sections.find((s) => s.id === sectionId);
                if (!section) return null;
                return (
                  <SectionCard
                    key={section.id}
                    flow={flow}
                    section={section}
                    number={flow.sections.indexOf(section) + 1}
                    segments={segments}
                    canSeek={canSeek}
                    onSeek={onSeek}
                    expanded={open.has(section.id)}
                    onToggle={() => toggle(section.id)}
                  />
                );
              })}
            </section>
          ))}

          <Closing flow={flow} segments={segments} canSeek={canSeek} onSeek={onSeek} />
          <Coverage flow={flow} />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- evidence --- */

function Sources({
  ids,
  segments,
  canSeek,
  onSeek,
}: {
  ids: string[];
  segments: TranscriptSegment[];
  canSeek: boolean;
  onSeek: (sec: number) => void;
}) {
  const resolved = resolveCitations(ids, segments);
  if (resolved.ranges.length === 0) return null;
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {resolved.ranges.map((range) => {
        const label =
          range.startSec === null
            ? `${range.fromIndex + 1}${range.toIndex !== range.fromIndex ? `–${range.toIndex + 1}` : ""} 区間`
            : fmtSec(range.startSec);
        // No timestamp or no audio means no playback link, rather than a
        // button that silently does nothing.
        const playable = canSeek && range.startSec !== null;
        return (
          <button
            key={`${range.fromIndex}-${range.toIndex}`}
            type="button"
            onClick={() => playable && onSeek(range.startSec!)}
            disabled={!playable}
            title={playable ? "この場面を再生します" : "この箇所は再生できません"}
            className={`pill border border-line font-mono text-[10px] ${
              playable ? "text-ink-soft hover:border-accent hover:text-accent" : "text-ink-soft/70"
            }`}
          >
            {playable ? "▶ " : ""}
            {label}
          </button>
        );
      })}
    </span>
  );
}

function Evidence({
  value,
  segments,
  canSeek,
  onSeek,
  className = "",
}: {
  value: EvidenceText;
  segments: TranscriptSegment[];
  canSeek: boolean;
  onSeek: (sec: number) => void;
  className?: string;
}) {
  const note = BASIS_NOTE[value.basis];
  return (
    <div className={className}>
      <p className="text-sm leading-relaxed">
        {value.text}
        <Sources ids={value.sourceSegmentIds} segments={segments} canSeek={canSeek} onSeek={onSeek} />
      </p>
      {note && <p className="mt-0.5 text-[11px] text-ink-soft">［{note}］</p>}
      {value.uncertainty && (
        <p className="mt-0.5 text-[11px] text-warn">※ {value.uncertainty}</p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- big picture --- */

function BigPicture({
  flow,
  segments,
  canSeek,
  onSeek,
}: {
  flow: Flow;
  segments: TranscriptSegment[];
  canSeek: boolean;
  onSeek: (sec: number) => void;
}) {
  return (
    <section className="card space-y-4 p-5">
      <div>
        <h3 className="text-lg font-semibold">{flow.title}</h3>
      </div>

      {flow.mainQuestions.length > 0 && (
        <div>
          <p className="section-title mb-1">講義の中心となる問い</p>
          <div className="space-y-2">
            {flow.mainQuestions.map((q, i) => (
              <Evidence key={i} value={q} segments={segments} canSeek={canSeek} onSeek={onSeek} />
            ))}
          </div>
        </div>
      )}

      {flow.overview.length > 0 && (
        <div>
          <p className="section-title mb-1">講義全体の説明</p>
          <div className="space-y-2">
            {flow.overview.map((o, i) => (
              <Evidence key={i} value={o} segments={segments} canSeek={canSeek} onSeek={onSeek} />
            ))}
          </div>
        </div>
      )}

      {flow.sections.length > 0 && (
        <div>
          <p className="section-title mb-1.5">流れの一覧</p>
          <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
            {flow.sections.map((section, i) => (
              <li key={section.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-ink-soft">→</span>}
                <a
                  href={`#flow-${section.id}`}
                  className="pill border border-line bg-surface text-ink-soft hover:border-accent hover:text-accent"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-1.5 text-[11px] text-ink-soft">
            矢印は説明の順序を示しています。因果関係を意味するものではありません。
          </p>
        </div>
      )}

      {flow.relationships.length > 0 && (
        <div>
          <p className="section-title mb-1">話題どうしの関係</p>
          <ul className="space-y-1.5">
            {flow.relationships.map((rel, i) => {
              const from = flow.sections.find((s) => s.id === rel.fromSectionId);
              const to = flow.sections.find((s) => s.id === rel.toSectionId);
              if (!from || !to) return null;
              return (
                <li key={i} className="text-sm">
                  <span className="pill border border-line text-[10px] text-ink-soft">
                    {RELATION_LABEL[rel.type] ?? rel.type}
                  </span>{" "}
                  <span className="text-ink-soft">
                    {from.title} → {to.title}
                  </span>
                  <span className="block pl-1 text-xs text-ink-soft">{rel.explanation.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- a card --- */

function SectionCard({
  flow,
  section,
  number,
  segments,
  canSeek,
  onSeek,
  expanded,
  onToggle,
}: {
  flow: Flow;
  section: FlowSection;
  number: number;
  segments: TranscriptSegment[];
  canSeek: boolean;
  onSeek: (sec: number) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDetails = section.details.length > 0;
  const bodyId = `flow-body-${section.id}`;
  void flow;

  return (
    <article id={`flow-${section.id}`} className="card p-4 scroll-mt-20">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-xs text-ink-soft">{number}</span>
        <h4 className="font-semibold">{section.title}</h4>
        <Sources
          ids={section.sourceSegmentIds}
          segments={segments}
          canSeek={canSeek}
          onSeek={onSeek}
        />
      </div>

      <p className="mt-2 text-xs text-ink-soft">この部分が説明していること</p>
      <Evidence
        value={section.purpose}
        segments={segments}
        canSeek={canSeek}
        onSeek={onSeek}
        className="mt-0.5"
      />

      <div className="mt-3 space-y-2">
        {section.explanation.map((e, i) => (
          <Evidence key={i} value={e} segments={segments} canSeek={canSeek} onSeek={onSeek} />
        ))}
      </div>

      {section.connectionFromPrevious && (
        <div className="mt-3 border-l-2 border-line pl-3">
          <p className="text-xs text-ink-soft">ここに来る理由</p>
          <Evidence
            value={section.connectionFromPrevious}
            segments={segments}
            canSeek={canSeek}
            onSeek={onSeek}
          />
        </div>
      )}

      {hasDetails && (
        <>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={bodyId}
            className="btn-ghost mt-3 px-2.5 py-1 text-xs"
          >
            {expanded ? "▾ くわしい内容を閉じる" : `▸ くわしい内容（${section.details.length}）`}
          </button>
          {expanded && (
            <div id={bodyId} className="mt-2 space-y-2.5 rounded-lg bg-surface-2/60 p-3">
              {section.details.map((detail, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-ink-soft">
                    <span className="pill mr-1.5 border border-line text-[10px]">
                      {DETAIL_LABEL[detail.kind]}
                    </span>
                    {detail.label}
                  </p>
                  <Evidence
                    value={detail.content}
                    segments={segments}
                    canSeek={canSeek}
                    onSeek={onSeek}
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {section.connectionToNext && (
        <div className="mt-3 border-t border-line/60 pt-2">
          <p className="text-xs text-ink-soft">次につながる理由</p>
          <Evidence
            value={section.connectionToNext}
            segments={segments}
            canSeek={canSeek}
            onSeek={onSeek}
          />
        </div>
      )}
    </article>
  );
}

/* -------------------------------------------------------------- closing --- */

function Closing({
  flow,
  segments,
  canSeek,
  onSeek,
}: {
  flow: Flow;
  segments: TranscriptSegment[];
  canSeek: boolean;
  onSeek: (sec: number) => void;
}) {
  const props = { segments, canSeek, onSeek };
  return (
    <section className="card space-y-4 p-5">
      <div>
        <p className="section-title mb-1">講義の結び</p>
        {flow.conclusion.length === 0 ? (
          <p className="text-sm text-ink-soft">
            この書き起こしの範囲には、明示的な結論はありませんでした。
          </p>
        ) : (
          <div className="space-y-2">
            {flow.conclusion.map((c, i) => (
              <Evidence key={i} value={c} {...props} />
            ))}
          </div>
        )}
      </div>

      {flow.unresolvedQuestions.length > 0 && (
        <div>
          <p className="section-title mb-1">残された論点</p>
          <div className="space-y-2">
            {flow.unresolvedQuestions.map((q, i) => (
              <Evidence key={i} value={q} {...props} />
            ))}
          </div>
        </div>
      )}

      {flow.assignments.length > 0 && (
        <div>
          <p className="section-title mb-1">課題</p>
          <ul className="space-y-2">
            {flow.assignments.map((a, i) => (
              <li key={i}>
                <Evidence value={a.task} {...props} />
                {a.deadlineOriginal && (
                  <p className="mt-0.5 text-xs text-ink-soft">
                    提出期限:「{a.deadlineOriginal}」
                    {a.deadlineISO ? `（${a.deadlineISO}）` : "（この録音だけでは日付を特定できません）"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {flow.examMentions.length > 0 && (
        <div>
          <p className="section-title mb-1">試験に関する言及</p>
          <div className="space-y-2">
            {flow.examMentions.map((e, i) => (
              <Evidence key={i} value={e} {...props} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- coverage --- */

function Coverage({ flow }: { flow: Flow }) {
  const [open, setOpen] = useState(false);
  const counts = {
    represented: flow.coverage.filter((c) => c.status === "represented").length,
    nonInstructional: flow.coverage.filter((c) => c.status === "non_instructional").length,
    unresolved: flow.coverage.filter((c) => c.status === "unresolved").length,
  };
  const problems = flow.coverage.filter((c) => c.status !== "represented");

  return (
    <section className="card p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="flow-coverage"
        className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
      >
        <span className="section-title">取りこぼしの確認</span>
        <span className="text-xs text-ink-soft">
          説明に含まれた {counts.represented} 区間 ・ 指導内容なし {counts.nonInstructional} ・
          未整理 {counts.unresolved} {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div id="flow-coverage" className="mt-3 space-y-2">
          <p className="text-xs text-ink-soft">
            これは書き起こしのどの区間が説明に使われたかの集計です。説明の内容が正しいことや、
            録音が講義全体を捉えていることを示すものではありません。
          </p>
          {flow.warnings.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-warn">
              {flow.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          {problems.length > 0 && (
            <ul className="space-y-1 text-xs text-ink-soft">
              {problems.slice(0, 40).map((c) => (
                <li key={c.segmentId}>
                  <span className="font-mono">{c.segmentId}</span>{" "}
                  {c.status === "non_instructional" ? "指導内容なし" : "未整理"}
                  {c.reason ? `: ${c.reason}` : ""}
                </li>
              ))}
              {problems.length > 40 && <li>ほか {problems.length - 40} 件</li>}
            </ul>
          )}
          <p className="text-[11px] text-ink-soft">
            作成: {new Date(flow.createdAt).toLocaleString("ja-JP")} ・ モデル: {flow.model} ・
            プロンプト: {flow.promptVersion}
          </p>
        </div>
      )}
    </section>
  );
}
