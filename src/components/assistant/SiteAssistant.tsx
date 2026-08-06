'use client';

/**
 * Site-wide assistant.
 *
 * Mounted once in the locale layout, so it is present on every page and its
 * conversation survives navigation between routes.
 *
 * Presentation mirrors the grounding guarantee. A `fact` block is corpus text
 * rendered verbatim next to the record it came from; a `not-verified` block is
 * styled so it cannot be misread as an assertion; a refusal is a refusal, with
 * no "but here is my best guess" beneath it. Nothing on screen is model prose —
 * the server composes every factual line before it is sent.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

interface Citation {
  label: string;
  detail?: string;
  excerpt?: string;
  urls: string[];
}

type Block =
  | { kind: 'lead' | 'note' | 'closing' | 'not-verified-heading' | 'cycle'; text: string }
  | { kind: 'fact'; text: string; ref: string }
  | { kind: 'not-verified'; text: string; ref?: string };

interface Section {
  id: string;
  title: string;
  subtitle?: string;
  blocks: Block[];
  citations: Citation[];
  links: { href: string; label: string }[];
}

interface Answer {
  intent: string;
  sections: Section[];
  refused: boolean;
  refusalReason?: string;
  suggestions: string[];
  disclaimer: string;
  provider: string;
  verifiedAt?: string | null;
}

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  answer?: Answer;
}

const COPY = {
  en: {
    open: 'Ask CareerVerse',
    close: 'Close assistant',
    title: 'CareerVerse Assistant',
    tagline: 'Answers only from verified sources.',
    placeholder: 'Ask about a university, a scholarship, or this site',
    inputLabel: 'Ask the CareerVerse assistant',
    send: 'Ask',
    thinking: 'Checking verified sources…',
    error: 'Could not get a response.',
    rateLimited: 'Too many questions — please wait a moment and try again.',
    sources: 'Sources',
    tryThese: 'Try one of these:',
    devMode: 'development mode (rule-based response)',
    verified: 'Verified',
    refusals: {
      'no-name-match':
        'I could not match that name to a record in the MEXT school-code registry. The registry stores official Japanese names, so the Japanese name may work where the English one does not.',
      'no-matching-page': 'I could not match that to a page on this site.',
      'no-relevant-claims':
        'That falls outside the five scholarship programmes CareerVerse has audited.',
      'no-supported-sections':
        'I could not confirm that from the audited scholarship sources.',
      'out-of-scope':
        'I can only answer from sources CareerVerse has verified — universities in the MEXT registry, the five audited scholarship programmes, and how this site works.',
    } as Record<string, string>,
    refusalFallback: 'I could not confirm that from a verified source.',
  },
  ja: {
    open: 'CareerVerseに質問',
    close: 'アシスタントを閉じる',
    title: 'CareerVerse アシスタント',
    tagline: '検証済みソースのみから回答します。',
    placeholder: '大学・奨学金・このサイトについて質問',
    inputLabel: 'CareerVerseアシスタントに質問する',
    send: '質問',
    thinking: '検証済みソースを確認中…',
    error: '応答を取得できませんでした。',
    rateLimited: '質問が多すぎます。少し待ってから再試行してください。',
    sources: '出典',
    tryThese: '例：',
    devMode: '開発モード（ルールベース応答）',
    verified: '検証日',
    refusals: {
      'no-name-match':
        'その名称に一致する記録を文部科学省の学校コードから見つけられませんでした。収録されているのは正式な日本語名称のため、日本語名でお試しください。',
      'no-matching-page': 'そのご質問に該当するページを特定できませんでした。',
      'no-relevant-claims': 'ご質問は、CareerVerseが監査済みの奨学金5制度の範囲外です。',
      'no-supported-sections': '監査済みの奨学金ソースからは確認できませんでした。',
      'out-of-scope':
        'CareerVerseが検証済みのソース（文部科学省の学校コードに収録された大学、監査済みの奨学金5制度、本サイトの使い方）についてのみ回答できます。',
    } as Record<string, string>,
    refusalFallback: '検証済みソースからは確認できませんでした。',
  },
} as const;

export function SiteAssistant(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const t = ja ? COPY.ja : COPY.en;

  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelId = useId();
  const titleId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Keep the newest turn in view without yanking the whole page.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  async function ask(question: string): Promise<void> {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    const history = turns.map((turn) => ({ role: turn.role, content: turn.content }));
    setTurns((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');

    try {
      const res = await fetch('/api/chat/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          locale: ja ? 'ja' : 'en',
          conversation: history.slice(-8),
        }),
      });
      if (res.status === 429) {
        setError(t.rateLimited);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const answer = (await res.json()) as Answer;
      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer.sections.map((s) => s.title).join(', '),
          answer,
        },
      ]);
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="fixed bottom-4 right-4 z-[55] flex h-14 min-h-[44px] w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan2 via-violet2 to-indigo2 text-white shadow-panel transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <span className="sr-only">{open ? t.close : t.open}</span>
        <ChatGlyph open={open} />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[85dvh] flex-col rounded-t-panel border border-ink/10 bg-white shadow-panel sm:inset-x-auto sm:bottom-20 sm:right-4 sm:max-h-[70dvh] sm:w-[24rem] sm:rounded-panel"
        >
          <header className="flex items-start justify-between gap-2 border-b border-ink/10 px-4 py-3">
            <div>
              <h2 id={titleId} className="text-sm font-bold text-ink">
                {t.title}
              </h2>
              <p className="mt-0.5 text-[11px] text-ink-soft">{t.tagline}</p>
            </div>
            <button
              type="button"
              onClick={close}
              className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className="sr-only">{t.close}</span>
              <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div ref={logRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {turns.length === 0 && <Suggestions label={t.tryThese} items={ja ? SEEDS.ja : SEEDS.en} onPick={ask} />}

            {turns.map((turn, i) =>
              turn.role === 'user' ? (
                <p
                  key={i}
                  className="ml-auto max-w-[85%] rounded-2xl bg-ink px-3 py-2 text-sm text-white"
                >
                  {turn.content}
                </p>
              ) : (
                <AssistantTurn key={i} answer={turn.answer} t={t} onPick={ask} />
              ),
            )}

            {busy && <p className="text-xs text-ink-soft">{t.thinking}</p>}
            {error && <p className="text-xs text-coral">{error}</p>}
          </div>

          <form
            className="flex gap-2 border-t border-ink/10 px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <label htmlFor={`${panelId}-input`} className="sr-only">
              {t.inputLabel}
            </label>
            <input
              ref={inputRef}
              id={`${panelId}-input`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder={t.placeholder}
              className="min-h-[44px] flex-1 rounded-full border border-ink/15 bg-white px-4 text-sm text-ink placeholder:text-ink-soft/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan2"
            />
            <button
              type="submit"
              disabled={busy || input.trim() === ''}
              className="min-h-[44px] rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {t.send}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const SEEDS = {
  en: [
    'What is Waseda University’s MEXT school code?',
    'How much is the JASSO Honors Scholarship?',
    'Where do I track my applications?',
  ],
  ja: ['早稲田大学の学校コードは？', 'JASSO学習奨励費の金額は？', '出願の進捗はどこで管理できますか？'],
};

function Suggestions({
  label,
  items,
  onPick,
}: {
  label: string;
  items: readonly string[];
  onPick: (q: string) => void;
}): React.JSX.Element {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-left text-[11px] text-ink transition-colors hover:border-cyan2/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssistantTurn({
  answer,
  t,
  onPick,
}: {
  answer?: Answer;
  t: (typeof COPY)['en'] | (typeof COPY)['ja'];
  onPick: (q: string) => void;
}): React.JSX.Element {
  if (!answer) return <></>;

  if (answer.refused || answer.sections.length === 0) {
    const reason = answer.refusalReason ?? '';
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-amber2/30 bg-amber2/5 p-3">
          <p className="text-sm text-ink">{t.refusals[reason] ?? t.refusalFallback}</p>
        </div>
        {answer.suggestions.length > 0 && (
          <Suggestions label={t.tryThese} items={answer.suggestions} onPick={onPick} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {answer.sections.map((s) => (
        <article key={s.id} className="rounded-xl border border-ink/10 bg-white p-3">
          <h3 className="text-sm font-bold text-ink">{s.title}</h3>
          {s.subtitle && <p className="text-[11px] text-ink-soft">{s.subtitle}</p>}

          <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink">
            {s.blocks.map((b, i) => {
              if (b.kind === 'fact') {
                return (
                  <p key={i} className="flex gap-1.5">
                    <span aria-hidden className="text-indigo2">
                      •
                    </span>
                    <span>
                      {b.text}{' '}
                      <span className="rounded bg-ink/5 px-1 py-0.5 align-middle font-mono text-[10px] text-ink-soft">
                        {b.ref}
                      </span>
                    </span>
                  </p>
                );
              }
              if (b.kind === 'not-verified') {
                return (
                  <p key={i} className="flex gap-1.5 text-xs text-ink-soft">
                    <span aria-hidden className="text-amber2">
                      •
                    </span>
                    <span>
                      {b.text}
                      {b.ref && (
                        <>
                          {' '}
                          <span className="rounded bg-amber2/15 px-1 py-0.5 align-middle font-mono text-[10px]">
                            {b.ref}
                          </span>
                        </>
                      )}
                    </span>
                  </p>
                );
              }
              if (b.kind === 'cycle') {
                return (
                  <p
                    key={i}
                    className="my-1 rounded-lg border border-amber2/40 bg-amber2/10 px-2.5 py-2 text-xs font-medium text-amber2"
                  >
                    {b.text}
                  </p>
                );
              }
              if (b.kind === 'not-verified-heading') {
                return (
                  <p key={i} className="pt-1 text-[11px] font-semibold text-amber2">
                    {b.text}
                  </p>
                );
              }
              if (b.kind === 'note' || b.kind === 'closing') {
                return (
                  <p key={i} className="pt-1 text-[11px] text-ink-soft">
                    {b.text}
                  </p>
                );
              }
              return <p key={i}>{b.text}</p>;
            })}
          </div>

          {s.citations.length > 0 && (
            <div className="mt-2.5 border-t border-ink/10 pt-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                {t.sources}
              </h4>
              <ul className="mt-1 space-y-1">
                {s.citations.map((c) => (
                  <li key={`${s.id}-${c.label}`} className="text-[11px] text-ink-soft">
                    <span className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[10px]">
                      {c.label}
                    </span>{' '}
                    {c.detail}
                    {c.excerpt && <span className="mt-0.5 block opacity-80">「{c.excerpt}」</span>}
                    {c.urls.map((u) => (
                      <a
                        key={u}
                        href={u}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block break-all text-indigo2 hover:underline"
                      >
                        {u}
                      </a>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {s.links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full bg-cyan2/10 px-2.5 py-1 text-[11px] font-semibold text-cyan2 hover:bg-cyan2/20"
                >
                  {l.label} →
                </Link>
              ))}
            </div>
          )}
        </article>
      ))}

      <p className="text-[10px] leading-relaxed text-ink-soft">
        {answer.verifiedAt ? `${t.verified}: ${answer.verifiedAt} · ` : ''}
        {answer.provider === 'mock' ? `${t.devMode} · ` : ''}
        {answer.disclaimer}
      </p>
    </div>
  );
}

function ChatGlyph({ open }: { open: boolean }): React.JSX.Element {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      ) : (
        <path
          d="M20 12a8 8 0 0 1-8 8H5l1.5-3.2A8 8 0 1 1 20 12Z"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
