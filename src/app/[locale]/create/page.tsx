'use client';

/**
 * Future Creation Portal + five-question rapid simulation.
 * Spatial card onboarding — answers join the user's "future model" as glowing
 * orbs along a growing path. Anonymous use is allowed; the deterministic
 * engine runs locally at the end.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAppStore } from '@/lib/store/app';
import type { EducationLevel, FieldId, JlptLevel, LocationId, SimProfile, UncertainNumber } from '@/lib/simulation/types';
import { pick, type Bi } from '@/lib/i18n/bi';

const EXAMPLES: Bi[] = [
  { en: 'I cannot decide between university and vocational school.', ja: '大学か専門学校か決められません。' },
  { en: 'I want to work in IT in Tokyo.', ja: '東京でITの仕事がしたいです。' },
  { en: 'I want the fastest realistic route to stable employment.', ja: '安定した就職への最短の現実的ルートを知りたいです。' },
  { en: 'I want an affordable business degree.', ja: '学費を抑えてビジネスの学位を取りたいです。' },
  { en: 'I want to work in hospitality after language school.', ja: '日本語学校の後、ホテル・観光業界で働きたいです。' },
];

const FIELD_OPTIONS: Array<{ id: FieldId; label: Bi; icon: string }> = [
  { id: 'it', label: { en: 'IT & software', ja: 'IT・ソフトウェア' }, icon: '⌘' },
  { id: 'business', label: { en: 'Business & office', ja: 'ビジネス・事務' }, icon: '◫' },
  { id: 'hospitality', label: { en: 'Hospitality & tourism', ja: 'ホテル・観光' }, icon: '⛩' },
  { id: 'foodservice', label: { en: 'Restaurant & food service', ja: '飲食・外食' }, icon: '🍱' },
  { id: 'realestate', label: { en: 'Real estate', ja: '不動産' }, icon: '⌂' },
];

const EDU_OPTIONS: Array<{ id: EducationLevel; label: Bi }> = [
  { id: 'highschool', label: { en: 'High school graduate', ja: '高校卒業' } },
  { id: 'some-college', label: { en: 'Some college / diploma', ja: '短大・専門・中退など' } },
  { id: 'bachelor', label: { en: "Bachelor's degree", ja: '学士（大学卒業）' } },
  { id: 'master', label: { en: "Master's or higher", ja: '修士以上' } },
];

const JLPT_OPTIONS: Array<{ id: JlptLevel; label: Bi }> = [
  { id: 'none', label: { en: 'Not yet', ja: 'まだ持っていない' } },
  { id: 'n5', label: { en: 'N5', ja: 'N5' } },
  { id: 'n4', label: { en: 'N4', ja: 'N4' } },
  { id: 'n3', label: { en: 'N3', ja: 'N3' } },
  { id: 'n2', label: { en: 'N2', ja: 'N2' } },
  { id: 'n1', label: { en: 'N1', ja: 'N1' } },
];

const BUDGET_OPTIONS: Array<{ id: string; label: Bi; value: UncertainNumber }> = [
  { id: 'b1', label: { en: 'Under ¥500,000', ja: '〜50万円' }, value: { min: 200_000, expected: 400_000, max: 500_000 } },
  { id: 'b2', label: { en: '¥500,000 – ¥1,000,000', ja: '50万〜100万円' }, value: { min: 500_000, expected: 750_000, max: 1_000_000 } },
  { id: 'b3', label: { en: '¥1,000,000 – ¥2,000,000', ja: '100万〜200万円' }, value: { min: 1_000_000, expected: 1_500_000, max: 2_000_000 } },
  { id: 'b4', label: { en: '¥2,000,000 – ¥4,000,000', ja: '200万〜400万円' }, value: { min: 2_000_000, expected: 3_000_000, max: 4_000_000 } },
  { id: 'b5', label: { en: 'Over ¥4,000,000', ja: '400万円〜' }, value: { min: 4_000_000, expected: 5_000_000, max: 6_500_000 } },
];

const LOCATION_OPTIONS: Array<{ id: LocationId; label: Bi }> = [
  { id: 'tokyo', label: { en: 'Tokyo（東京）', ja: '東京' } },
  { id: 'yokohama', label: { en: 'Yokohama（横浜）', ja: '横浜' } },
  { id: 'chiba', label: { en: 'Chiba（千葉）', ja: '千葉' } },
  { id: 'saitama', label: { en: 'Saitama（埼玉）', ja: '埼玉' } },
  { id: 'kanto-any', label: { en: 'Anywhere in Kanto', ja: '関東ならどこでも' } },
];

const STEP_TITLES: Bi[] = [
  { en: 'What future do you want to build in Japan?', ja: '日本で、どんな未来をつくりたいですか？' },
  { en: 'Which field calls to you?', ja: 'どの分野に進みたいですか？' },
  { en: 'Your education so far', ja: 'これまでの学歴' },
  { en: 'Your Japanese level', ja: 'あなたの日本語レベル' },
  { en: 'Your education budget', ja: '教育に使える予算' },
  { en: 'Where do you want to live?', ja: 'どこに住みたいですか？' },
];

function guessIntent(text: string): { field: FieldId; location: LocationId; matched: boolean } {
  const rules: Array<[FieldId, RegExp]> = [
    ['it', /\b(it|software|program|engineer|developer|web|app|data|ai)\b|ＩＴ|エンジニア|プログラ|開発/i],
    ['hospitality', /hotel|tourism|hospitality|travel|ホテル|観光|ブライダル/i],
    ['foodservice', /restaurant|food|cafe|chef|レストラン|飲食|外食|カフェ|店長/i],
    ['realestate', /real ?estate|property|housing|不動産|宅建/i],
    ['business', /business|trade|office|marketing|sales|ビジネス|貿易|事務|営業|経営/i],
  ];
  const locRules: Array<[LocationId, RegExp]> = [
    ['tokyo', /tokyo|東京/i],
    ['yokohama', /yokohama|横浜|kanagawa|神奈川/i],
    ['chiba', /chiba|千葉|narita|成田/i],
    ['saitama', /saitama|埼玉/i],
  ];
  const field = rules.find(([, re]) => re.test(text))?.[0];
  const location = locRules.find(([, re]) => re.test(text))?.[0] ?? 'kanto-any';
  return { field: field ?? 'business', location, matched: Boolean(field) };
}

interface SpeechRecognitionLike {
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export default function CreatePage(): React.JSX.Element {
  const locale = useLocale();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const runSimulation = useAppStore((s) => s.runSimulation);

  const [step, setStep] = useState(0);
  const [goalText, setGoalText] = useState('');
  const [field, setField] = useState<FieldId | null>(null);
  const [fieldSuggested, setFieldSuggested] = useState(false);
  const [education, setEducation] = useState<EducationLevel | null>(null);
  const [jlpt, setJlpt] = useState<JlptLevel | null>(null);
  const [expectingNext, setExpectingNext] = useState(false);
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationId | null>(null);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [running, setRunning] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  // Rotating example futures
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setExampleIdx((i) => (i + 1) % EXAMPLES.length), 4000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const speechSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const toggleVoice = useCallback(() => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as Record<string, new () => SpeechRecognitionLike>;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = locale === 'ja' ? 'ja-JP' : 'en-US';
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      setGoalText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, locale]);

  const startQuestions = (text: string): void => {
    const g = guessIntent(text);
    setGoalText(text);
    if (g.matched) {
      setField(g.field);
      setFieldSuggested(true);
    }
    if (g.location !== 'kanto-any') setLocation(g.location);
    setStep(1);
  };

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return field !== null;
      case 2: return education !== null;
      case 3: return jlpt !== null;
      case 4: return budgetId !== null;
      case 5: return location !== null;
      default: return true;
    }
  }, [step, field, education, jlpt, budgetId, location]);

  const finish = (): void => {
    if (!field || !education || !jlpt || !budgetId || !location) return;
    const budget = BUDGET_OPTIONS.find((b) => b.id === budgetId)?.value;
    if (!budget) return;
    const nextLevel: Record<JlptLevel, JlptLevel> = { none: 'n5', n5: 'n4', n4: 'n3', n3: 'n2', n2: 'n1', n1: 'n1' };
    const profile: SimProfile = {
      goalText,
      field,
      education,
      jlptCurrent: jlpt,
      ...(expectingNext && jlpt !== 'n1' ? { jlptExpected: nextLevel[jlpt] } : {}),
      budgetJpy: budget,
      location,
      interests: [field],
    };
    setRunning(true);
    // Give the launch animation one beat, then run the deterministic engine.
    setTimeout(() => {
      runSimulation(profile);
      router.push('/universe');
    }, reducedMotion ? 50 : 900);
  };

  // Answer orbs joining the "future model"
  const orbs = [
    field && { color: '#00B8D9', label: pick(FIELD_OPTIONS.find((f) => f.id === field)?.label ?? { en: '', ja: '' }, locale) },
    education && { color: '#8B5CF6', label: pick(EDU_OPTIONS.find((e) => e.id === education)?.label ?? { en: '', ja: '' }, locale) },
    jlpt && { color: '#10B981', label: jlpt === 'none' ? 'JLPT —' : `JLPT ${jlpt.toUpperCase()}${expectingNext ? ' ↗' : ''}` },
    budgetId && { color: '#F59E0B', label: pick(BUDGET_OPTIONS.find((b) => b.id === budgetId)?.label ?? { en: '', ja: '' }, locale) },
    location && { color: '#3D4A8C', label: pick(LOCATION_OPTIONS.find((l) => l.id === location)?.label ?? { en: '', ja: '' }, locale) },
  ].filter(Boolean) as Array<{ color: string; label: string }>;

  useEffect(() => {
    if (liveRef.current && step > 0) {
      liveRef.current.textContent =
        locale === 'ja'
          ? `質問 ${step} / 5：${pick(STEP_TITLES[step] ?? { en: '', ja: '' }, locale)}`
          : `Question ${step} of 5: ${pick(STEP_TITLES[step] ?? { en: '', ja: '' }, locale)}`;
    }
  }, [step, locale]);

  const cardCls = (active: boolean): string =>
    `min-h-[64px] rounded-panel border-2 p-4 text-left text-sm font-medium transition-all duration-200 ${
      active
        ? 'border-cyan2 bg-cyan2/10 text-ink shadow-glow'
        : 'border-transparent cv-glass text-ink-soft hover:border-cyan2/40 hover:text-ink'
    }`;

  return (
    <div className="cv-hero-gradient min-h-[92svh]">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p ref={liveRef} aria-live="polite" className="sr-only" />

        {/* Future model — the growing path of answer orbs */}
        {step > 0 && (
          <div aria-hidden="true" className="mb-8 flex items-center justify-center gap-1 sm:gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: orbs[i] ? 1 : 0.55,
                    boxShadow: orbs[i] ? `0 0 16px ${orbs[i]?.color}88` : '0 0 0 transparent',
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[10px] font-bold sm:h-10 sm:w-10"
                  style={{ color: orbs[i]?.color ?? '#B9BFD6' }}
                >
                  {orbs[i] ? '●' : i + 1}
                </motion.div>
                {i < 4 && (
                  <motion.div
                    initial={false}
                    animate={{ opacity: orbs[i] ? 1 : 0.25, scaleX: orbs[i] ? 1 : 0.6 }}
                    className="h-0.5 w-6 origin-left rounded bg-gradient-to-r from-cyan2 to-violet2 sm:w-12"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {step === 0 && (
              <div className="text-center">
                {/* Portal ring */}
                <div aria-hidden="true" className="relative mx-auto mb-8 h-40 w-40">
                  <motion.div
                    animate={reducedMotion ? {} : { rotate: 360 }}
                    transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-4 border-transparent"
                    style={{ borderImage: 'conic-gradient(from 0deg, #00B8D9, #8B5CF6, #10B981, #00B8D9) 1', borderRadius: '50%', border: 'none', background: 'conic-gradient(from 0deg, #00B8D944, #8B5CF644, #10B98144, #00B8D944)', WebkitMask: 'radial-gradient(circle, transparent 58%, black 60%)', mask: 'radial-gradient(circle, transparent 58%, black 60%)' }}
                  />
                  <div className="absolute inset-6 rounded-full bg-white/70 shadow-glow backdrop-blur" />
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">🌅</div>
                </div>

                <h1 className="text-balance text-2xl font-bold text-ink sm:text-4xl">
                  {pick(STEP_TITLES[0]!, locale)}
                </h1>
                <p className="mt-2 text-sm text-ink-soft">
                  {locale === 'ja'
                    ? '自由に入力するか、例を選んでください。約2〜3分で最初の結果が出ます。'
                    : 'Type freely or pick an example. Your first result arrives in about 2–3 minutes.'}
                </p>

                <form
                  className="mx-auto mt-6 max-w-xl"
                  onSubmit={(e) => {
                    e.preventDefault();
                    startQuestions(goalText || pick(EXAMPLES[exampleIdx]!, locale));
                  }}
                >
                  <div className="cv-glass-strong flex items-center gap-2 rounded-full p-2 shadow-panel">
                    <label htmlFor="goal" className="sr-only">
                      {pick(STEP_TITLES[0]!, locale)}
                    </label>
                    <input
                      id="goal"
                      value={goalText}
                      onChange={(e) => setGoalText(e.target.value)}
                      placeholder={pick(EXAMPLES[exampleIdx]!, locale)}
                      className="min-h-[44px] w-full bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink-soft/60"
                    />
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleVoice}
                        aria-pressed={listening}
                        aria-label={locale === 'ja' ? '音声入力' : 'Voice input'}
                        className={`min-h-[44px] rounded-full px-3 ${listening ? 'bg-coral/10 text-coral' : 'text-ink-soft hover:text-ink'}`}
                      >
                        {listening ? '◉' : '🎤'}
                      </button>
                    )}
                    <button
                      type="submit"
                      className="min-h-[44px] shrink-0 rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-6 text-sm font-semibold text-white shadow-glow hover:brightness-110"
                    >
                      {locale === 'ja' ? 'はじめる' : 'Begin'}
                    </button>
                  </div>
                </form>

                <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => startQuestions(pick(ex, locale))}
                      className="rounded-full border border-ink/10 bg-white/60 px-4 py-2 text-xs text-ink-soft transition-colors hover:border-violet2/50 hover:text-ink"
                    >
                      {pick(ex, locale)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step >= 1 && step <= 5 && (
              <div className="cv-glass-strong rounded-panel p-6 shadow-panel sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-violet2">
                  {locale === 'ja' ? `質問 ${step} / 5` : `Question ${step} of 5`}
                </p>
                <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">
                  {pick(STEP_TITLES[step]!, locale)}
                </h2>
                {step === 1 && fieldSuggested && (
                  <p className="mt-2 rounded-lg bg-violet2/10 px-3 py-2 text-xs text-violet2">
                    {locale === 'ja'
                      ? 'あなたの入力から候補を選びました。確認するか、変更してください。'
                      : 'We suggested a field from your goal. Please confirm or change it.'}
                  </p>
                )}

                <div className={`mt-6 grid gap-3 ${step === 3 ? 'grid-cols-3 sm:grid-cols-6' : 'sm:grid-cols-2'}`}>
                  {step === 1 &&
                    FIELD_OPTIONS.map((o) => (
                      <button key={o.id} onClick={() => setField(o.id)} className={cardCls(field === o.id)} aria-pressed={field === o.id}>
                        <span aria-hidden="true" className="mr-2 text-lg">{o.icon}</span>
                        {pick(o.label, locale)}
                      </button>
                    ))}
                  {step === 2 &&
                    EDU_OPTIONS.map((o) => (
                      <button key={o.id} onClick={() => setEducation(o.id)} className={cardCls(education === o.id)} aria-pressed={education === o.id}>
                        {pick(o.label, locale)}
                      </button>
                    ))}
                  {step === 3 &&
                    JLPT_OPTIONS.map((o) => (
                      <button key={o.id} onClick={() => setJlpt(o.id)} className={cardCls(jlpt === o.id)} aria-pressed={jlpt === o.id}>
                        {pick(o.label, locale)}
                      </button>
                    ))}
                  {step === 4 &&
                    BUDGET_OPTIONS.map((o) => (
                      <button key={o.id} onClick={() => setBudgetId(o.id)} className={cardCls(budgetId === o.id)} aria-pressed={budgetId === o.id}>
                        {pick(o.label, locale)}
                      </button>
                    ))}
                  {step === 5 &&
                    LOCATION_OPTIONS.map((o) => (
                      <button key={o.id} onClick={() => setLocation(o.id)} className={cardCls(location === o.id)} aria-pressed={location === o.id}>
                        {pick(o.label, locale)}
                      </button>
                    ))}
                </div>

                {step === 3 && jlpt && jlpt !== 'n1' && (
                  <label className="mt-4 flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={expectingNext}
                      onChange={(e) => setExpectingNext(e.target.checked)}
                      className="h-5 w-5 accent-[#00B8D9]"
                    />
                    {locale === 'ja'
                      ? '次のレベルの合格を見込んでいる（例：N2受験予定）'
                      : 'I expect to pass the next level soon (e.g. expecting N2)'}
                  </label>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setStep(step - 1)}
                    className="min-h-[44px] rounded-full px-5 text-sm font-medium text-ink-soft hover:text-ink"
                  >
                    ← {locale === 'ja' ? '戻る' : 'Back'}
                  </button>
                  {step < 5 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={!canNext}
                      className="min-h-[44px] rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 disabled:opacity-40"
                    >
                      {locale === 'ja' ? '次へ' : 'Next'} →
                    </button>
                  ) : (
                    <button
                      onClick={finish}
                      disabled={!canNext || running}
                      className="min-h-[44px] rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 disabled:opacity-40"
                    >
                      {running
                        ? locale === 'ja' ? '未来を計算中…' : 'Building your futures…'
                        : locale === 'ja' ? '未来をシミュレーションする' : 'Simulate my futures'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Collected orbs with labels */}
        {step > 0 && orbs.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label={locale === 'ja' ? 'これまでの回答' : 'Your answers so far'}>
            {orbs.map((o, i) => (
              <motion.span
                key={i}
                initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-medium"
                style={{ borderColor: `${o.color}66`, color: o.color }}
              >
                {o.label}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
