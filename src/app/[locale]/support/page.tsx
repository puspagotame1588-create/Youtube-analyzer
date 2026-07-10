'use client';

/**
 * Support — two layers: AI triage (labeled dev-mode without a key) and human
 * escalation. Legal/visa questions always route to qualified professionals.
 */

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAppStore, type SupportTicket } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';

const CATEGORIES: Array<{ id: SupportTicket['category']; en: string; ja: string }> = [
  { id: 'onboarding', en: 'Getting started', ja: 'はじめ方' },
  { id: 'schools', en: 'Schools & comparison', ja: '学校・比較' },
  { id: 'careers', en: 'Careers & plans', ja: 'キャリア・プラン' },
  { id: 'documents', en: 'Documents', ja: '書類' },
  { id: 'technical', en: 'Technical issue', ja: '技術的な問題' },
  { id: 'feedback', en: 'Feedback', ja: 'フィードバック' },
  { id: 'legal-referral', en: 'Visa / legal referral', ja: 'ビザ・法律相談の紹介' },
  { id: 'other', en: 'Other', ja: 'その他' },
];

export default function SupportPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const submitTicket = useAppStore((s) => s.submitTicket);
  const tickets = useAppStore((s) => s.tickets);
  const account = useAppStore((s) => s.account);

  const [category, setCategory] = useState<SupportTicket['category']>('onboarding');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [aiReply, setAiReply] = useState<{ reply: string; provider: string; escalate: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async (): Promise<void> => {
    if (!message.trim()) return;
    setSending(true);
    submitTicket({ category, message: message.trim(), email: email || account?.email });
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'support-triage', locale, message: message.trim() }),
      });
      if (res.ok) {
        const json = (await res.json()) as { provider: string; data: { reply: string; escalate: boolean } };
        setAiReply({ reply: json.data.reply, provider: json.provider, escalate: json.data.escalate });
      }
    } catch {
      // ticket is stored regardless; AI reply is best-effort
    } finally {
      setSending(false);
      setSent(true);
      setMessage('');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? 'サポート' : 'Support'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {ja
          ? '操作・学校比較・キャリアの質問はAIと運営チームが対応します。個別のビザ・法律の判断は資格を持つ専門家をご案内します。'
          : 'Product, school-comparison, and career questions are handled by AI plus the founding team. Individual visa/legal judgments are referred to qualified professionals.'}
      </p>

      <div className="mt-4 rounded-panel border border-indigo2/20 bg-indigo2/5 p-4 text-xs leading-relaxed text-ink">
        {ja
          ? '重要：CareerVerseの運営者は行政書士・弁護士・国家資格キャリアコンサルタントではありません。一般的な情報提供と整理のお手伝いを行います。'
          : 'Important: the CareerVerse team is not a licensed immigration professional or certified career counselor. We provide general information and help you get organized.'}
      </div>

      <form
        className="cv-glass mt-6 space-y-4 rounded-panel p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-ink-soft">{ja ? 'カテゴリ' : 'Category'}</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold ${
                  category === c.id ? 'border-cyan2 bg-cyan2/10 text-cyan2' : 'border-ink/10 bg-white/60 text-ink-soft'
                }`}
              >
                {ja ? c.ja : c.en}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? 'メッセージ' : 'Message'}</span>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink"
            placeholder={ja ? '困っていること、聞きたいことを書いてください…' : 'Tell us what you need help with…'}
          />
        </label>

        {!account && (
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '返信先メール（任意）' : 'Reply email (optional)'}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={sending}
          className="min-h-[48px] w-full rounded-full bg-gradient-to-r from-cyan2 to-violet2 text-sm font-semibold text-white shadow-glow hover:brightness-110 disabled:opacity-50"
        >
          {sending ? (ja ? '送信中…' : 'Sending…') : ja ? '送信' : 'Send'}
        </button>
      </form>

      {sent && (
        <div className="mt-4 rounded-panel border border-emerald2/30 bg-emerald2/5 p-4 text-sm text-ink" role="status">
          {ja ? 'チケットを受け付けました。' : 'Your ticket has been recorded.'}
        </div>
      )}

      {aiReply && (
        <div className="cv-glass mt-4 rounded-panel p-5 text-sm" role="status">
          {aiReply.provider === 'mock' && (
            <p className="mb-2 inline-block rounded-full bg-amber2/10 px-3 py-1 text-xs font-semibold text-amber2">
              {ja ? '開発モード — ルールベースの応答（AIモデルの応答ではありません）' : 'Development mode — rule-based response, not a live AI model'}
            </p>
          )}
          <p className="leading-relaxed text-ink">{aiReply.reply}</p>
          {aiReply.escalate && (
            <p className="mt-3 rounded-xl border border-indigo2/25 bg-indigo2/5 px-3 py-2 text-xs text-indigo2">
              {ja
                ? 'このご質問は担当者にエスカレーションされました。専門家への相談窓口もあわせてご案内します。'
                : 'This question has been escalated to a human. We will also share professional-referral options.'}
            </p>
          )}
        </div>
      )}

      {hydrated && tickets.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{ja ? 'あなたのチケット' : 'Your tickets'}</h2>
          <ul className="mt-2 space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-panel bg-white/60 p-4 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <strong className="text-ink">{CATEGORIES.find((c) => c.id === t.category)?.[ja ? 'ja' : 'en'] ?? t.category}</strong>
                  <span className="text-xs text-ink-soft">
                    {new Date(t.createdAt).toLocaleDateString(ja ? 'ja-JP' : 'en-US')} · {t.status}
                    {t.escalated && <span className="ml-1 text-indigo2">· {ja ? 'エスカレーション済み' : 'escalated'}</span>}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">{t.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-panel border border-ink/5 bg-white/60 p-5 text-sm text-ink-soft">
        <h2 className="font-bold text-ink">{ja ? 'その他の連絡方法' : 'Other channels'}</h2>
        <ul className="mt-2 space-y-1">
          <li>✉ support@careerverse.example（{ja ? 'ベータ用アドレス' : 'beta address'}）</li>
          <li>
            📅 {ja ? '個別相談の予約（人によるサポート）は近日提供予定です。' : 'Human consultation booking is coming soon.'}{' '}
            <span className="rounded-full bg-violet2/10 px-2 py-0.5 text-[10px] font-semibold text-violet2">
              {ja ? '準備中' : 'Coming soon'}
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
