'use client';

/**
 * Scholarship source assistant.
 *
 * Presentation mirrors the guarantee: an answer is rendered per programme, with
 * its citations attached to that programme and nowhere else, and anything the
 * audit could not confirm is rendered in a visually distinct block that never
 * reads as an assertion.
 *
 * The answer body arrives as typed blocks, not prose. A `fact` block carries an
 * audited statement verbatim plus the id it came from, so every factual line on
 * screen is traceable to a claim; the model contributed the selection and the
 * order, never the words.
 */

import { useRef, useState } from 'react';
import { useLocale } from 'next-intl';

interface Citation {
  claimId: string;
  statement: string;
  excerpt: string;
  sourceUrls: string[];
}

type AnswerBlock =
  | { kind: 'lead' | 'unpublished-heading' | 'note' | 'closing'; text: string }
  | { kind: 'fact' | 'unpublished'; text: string; claimId: string };

interface Section {
  programme: string;
  labelEn: string;
  labelJa: string;
  blocks: AnswerBlock[];
  answer: string;
  gate: { pass: number; mismatch: number; unconfirmed: number; gate: string } | null;
  scopeWarning: string | null;
  citations: Citation[];
  unpublished: Citation[];
}

interface ChatAnswer {
  sections: Section[];
  refused: boolean;
  refusalReason?: string;
  verifiedAt: string | null;
  productionStatus: string | null;
  provider?: string;
}

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  answer?: ChatAnswer;
}

const SUGGESTIONS_EN = [
  'How much is the JASSO Honors Scholarship?',
  'What is the Kyoritsu language requirement?',
  'When is the Rotary Yoneyama deadline?',
];
const SUGGESTIONS_JA = [
  'JASSO学習奨励費の金額は？',
  '共立国際交流奨学財団の語学要件は？',
  'ロータリー米山奨学金の締切は？',
];

export function ScholarshipChat(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  async function ask(question: string): Promise<void> {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');

    try {
      const res = await fetch('/api/chat/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, locale: ja ? 'ja' : 'en', conversation: history.slice(-8) }),
      });
      if (res.status === 429) {
        setError(ja ? 'リクエストが多すぎます。少し待ってから再試行してください。' : 'Too many requests — please wait a moment and try again.');
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const answer = (await res.json()) as ChatAnswer;
      setTurns((prev) => [
        ...prev,
        { role: 'assistant', content: answer.sections.map((s) => s.answer).join('\n\n'), answer },
      ]);
    } catch {
      setError(ja ? '応答を取得できませんでした。' : 'Could not get a response.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="mt-8 rounded-panel border border-indigo2/25 bg-white/70 p-5"
      aria-labelledby="schol-chat-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="schol-chat-title" className="text-lg font-bold text-ink">
          {ja ? '奨学金ソースアシスタント' : 'Scholarship Source Assistant'}
        </h2>
        <span className="rounded-full bg-indigo2/10 px-3 py-1 text-xs font-semibold text-indigo2">
          {ja ? '検証済み5制度のみ' : '5 audited programmes only'}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {ja
          ? '検証済みの公式ソース記載のみから回答します。確認できない事項は「確認できません」と回答します。出願前に必ず公式ページをご確認ください。'
          : 'Answers come only from audited official-source claims. Anything the audit could not confirm is reported as unconfirmed, never asserted. Always confirm on the official page before applying.'}
      </p>

      {turns.length === 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {(ja ? SUGGESTIONS_JA : SUGGESTIONS_EN).map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => void ask(s)}
                className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink transition-colors hover:border-indigo2/50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={liveRef} aria-live="polite" className="mt-4 space-y-4">
        {turns.map((t, i) =>
          t.role === 'user' ? (
            <p key={i} className="ml-auto max-w-[85%] rounded-2xl bg-ink px-4 py-2 text-sm text-white">
              {t.content}
            </p>
          ) : (
            <AssistantTurn key={i} answer={t.answer} ja={ja} />
          ),
        )}
        {busy && (
          <p className="text-xs text-ink-soft">{ja ? '検証済みソースを検索中…' : 'Searching audited sources…'}</p>
        )}
        {error && <p className="text-xs text-coral">{error}</p>}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <label htmlFor="schol-chat-input" className="sr-only">
          {ja ? '奨学金について質問する' : 'Ask about a scholarship'}
        </label>
        <input
          id="schol-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder={ja ? '例：JASSO学習奨励費の金額は？' : 'e.g. How much is the JASSO Honors Scholarship?'}
          className="min-h-[44px] flex-1 rounded-full border border-ink/15 bg-white px-4 text-sm text-ink placeholder:text-ink-soft/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan2"
        />
        <button
          type="submit"
          disabled={busy || input.trim() === ''}
          className="min-h-[44px] rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-5 text-sm font-semibold text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {ja ? '質問' : 'Ask'}
        </button>
      </form>
    </section>
  );
}

/**
 * Renders the server-composed blocks. Factual lines are marked with the claim
 * id that produced them, so the provenance is visible, not just asserted.
 */
function AnswerBody({ blocks }: { blocks: AnswerBlock[] }): React.JSX.Element {
  return (
    <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink">
      {blocks.map((b, i) => {
        if (b.kind === 'fact' || b.kind === 'unpublished') {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span aria-hidden className={b.kind === 'fact' ? 'text-indigo2' : 'text-amber2'}>
                •
              </span>
              <span className={b.kind === 'unpublished' ? 'text-ink-soft' : undefined}>
                {b.text}{' '}
                <span className="rounded bg-ink/5 px-1 py-0.5 align-middle font-mono text-[10px] text-ink-soft">
                  {b.claimId}
                </span>
              </span>
            </p>
          );
        }
        if (b.kind === 'unpublished-heading') {
          return (
            <p key={i} className="pt-1 text-xs font-semibold text-amber2">
              {b.text}
            </p>
          );
        }
        if (b.kind === 'note' || b.kind === 'closing') {
          return (
            <p key={i} className="pt-1 text-xs text-ink-soft">
              {b.text}
            </p>
          );
        }
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}

function AssistantTurn({ answer, ja }: { answer?: ChatAnswer; ja: boolean }): React.JSX.Element {
  if (!answer) return <></>;

  if (answer.refused || answer.sections.length === 0) {
    return (
      <div className="rounded-xl border border-amber2/30 bg-amber2/5 p-4 text-sm">
        <p className="font-medium text-ink">
          {ja
            ? '入手可能な公式ソースからは確認できませんでした。'
            : 'I could not confirm this from the available official sources.'}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {ja
            ? 'この質問は、検証済みの5制度の記載範囲外です。公式ページまたは在籍校にご確認ください。'
            : 'This question falls outside what the audit confirmed for the five indexed programmes. Please check the official page or your institution.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {answer.sections.map((s) => (
        <article key={s.programme} className="rounded-xl border border-ink/10 bg-white p-4">
          <h3 className="text-sm font-bold text-ink">{ja ? s.labelJa : s.labelEn}</h3>
          {s.scopeWarning && (
            <p className="mt-1 rounded-lg bg-amber2/10 px-2 py-1 text-[11px] text-amber2">
              {ja ? '適用範囲: ' : 'Scope: '}
              {s.scopeWarning}
            </p>
          )}
          <AnswerBody blocks={s.blocks} />

          {s.citations.length > 0 && (
            <div className="mt-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                {ja ? '出典（検証済み）' : 'Sources (verified)'}
              </h4>
              <ul className="mt-1 space-y-1.5">
                {s.citations.map((c) => (
                  <li key={c.claimId} className="text-xs">
                    <span className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                      {c.claimId}
                    </span>{' '}
                    <span className="text-ink-soft">{c.statement}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-soft/80">「{c.excerpt}」</span>
                    {c.sourceUrls.map((u) => (
                      <a
                        key={u}
                        href={u}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block break-all text-[11px] text-indigo2 hover:underline"
                      >
                        {u}
                      </a>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {s.unpublished.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber2/30 bg-amber2/5 p-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-amber2">
                {ja ? '公式に未公表（事実として扱えません）' : 'Not published officially — cannot be treated as fact'}
              </h4>
              <ul className="mt-1 space-y-1">
                {s.unpublished.map((c) => (
                  <li key={c.claimId} className="text-xs text-ink-soft">
                    <span className="rounded bg-amber2/15 px-1.5 py-0.5 font-mono text-[10px]">{c.claimId}</span>{' '}
                    {c.statement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}

      <p className="text-[11px] text-ink-soft">
        {ja ? '検証日: ' : 'Verified: '}
        {answer.verifiedAt ?? '—'}
        {answer.productionStatus ? ` · ${answer.productionStatus}` : ''}
        {answer.provider === 'mock'
          ? ja
            ? ' · 開発モード（ルールベース応答）'
            : ' · development mode (rule-based response)'
          : ''}
      </p>
    </div>
  );
}
