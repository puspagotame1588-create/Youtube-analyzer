'use client';

/**
 * Support — tickets go through /api/support (rate-limited, honeypot-protected,
 * reference-numbered, forwarded to a configured inbox when available) and are
 * also kept locally for the user's own records. AI triage assists; legal/visa
 * questions always route to qualified professionals.
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

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

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
  const [honeypot, setHoneypot] = useState('');
  const [aiReply, setAiReply] = useState<{ reply: string; provider: string; escalate: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ reference: string; delivered: boolean; deliveryConfigured: boolean } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const send = async (): Promise<void> => {
    if (!message.trim()) return;
    setSending(true);
    setSendError(null);
    setResult(null);
    const text = message.trim();
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: text,
          email: email || account?.email,
          locale,
          website: honeypot,
        }),
      });
      if (res.status === 429) {
        setSendError(ja ? '送信回数が多すぎます。しばらくしてからお試しください。' : 'Too many messages — please wait a while and try again.');
        return;
      }
      if (!res.ok) throw new Error('failed');
      const json = (await res.json()) as { reference: string; delivered: boolean; deliveryConfigured: boolean };
      setResult(json);
      submitTicket({ category, message: `[${json.reference}] ${text}` });
      setMessage('');

      // Best-effort AI triage reply (never blocks the ticket)
      try {
        const ai = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: 'support-triage', locale, message: text }),
        });
        if (ai.ok) {
          const aj = (await ai.json()) as { provider: string; data: { reply: string; escalate: boolean } };
          setAiReply({ reply: aj.data.reply, provider: aj.provider, escalate: aj.data.escalate });
        }
      } catch {
        /* triage is optional */
      }
    } catch {
      setSendError(ja ? '送信に失敗しました。時間をおいて再度お試しください。' : 'Sending failed. Please try again in a moment.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? 'サポート' : 'Support'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {ja
          ? '操作・学校比較・キャリアの質問に対応します。個別のビザ・法律の判断は、資格を持つ専門家をご案内します。'
          : 'We help with product, school-comparison, and career questions. Individual visa/legal judgments are referred to qualified professionals.'}
      </p>

      <div className="mt-4 rounded-panel border border-indigo2/20 bg-indigo2/5 p-4 text-xs leading-relaxed text-ink">
        {ja
          ? '重要：CareerVerseの運営者は行政書士・弁護士・国家資格キャリアコンサルタントではありません。一般的な情報提供と整理のお手伝いを行います。'
          : 'Important: the CareerVerse team is not a licensed immigration professional or certified career counselor. We provide general information and help you get organized.'}
      </div>

      <div className="mt-2 rounded-panel border border-coral/25 bg-coral/5 p-4 text-xs leading-relaxed text-ink">
        <strong className="text-coral">{ja ? '緊急の場合：' : 'In an emergency:'}</strong>{' '}
        {ja
          ? '生命・安全に関わる緊急時は110（警察）・119（消防・救急）へ。在留資格の期限が数日以内に迫っている場合は、このフォームではなく、直ちに最寄りの出入国在留管理局または行政書士・弁護士に相談してください。'
          : 'For life or safety emergencies call 110 (police) or 119 (fire/ambulance). If your residence-status deadline is within days, do not use this form — contact your regional immigration bureau or a qualified professional (gyoseishoshi/lawyer) immediately.'}
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

        {/* Honeypot — hidden from real users, catches naive bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

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

      {sendError && (
        <p role="alert" className="mt-4 rounded-panel border border-coral/40 bg-coral/5 px-4 py-3 text-sm text-coral">
          {sendError}
        </p>
      )}

      {result && (
        <div className="mt-4 rounded-panel border border-emerald2/30 bg-emerald2/5 p-4 text-sm text-ink" role="status">
          <p>
            <strong className="text-emerald2">
              {ja ? '受付番号' : 'Reference number'}: {result.reference}
            </strong>
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {result.delivered
              ? ja
                ? '運営チームの受信箱に送信されました。この受付番号を控えてください。'
                : 'Delivered to the team inbox. Please keep this reference number.'
              : result.deliveryConfigured
                ? ja
                  ? '配信中にエラーが発生しました。受付番号を控えて、時間をおいて再送してください。'
                  : 'Delivery hit an error — keep the reference number and try again shortly.'
                : ja
                  ? 'この環境では受信箱が未設定のため、チケットはこの端末に記録されました。受付番号を控えて、下記の連絡方法もご利用ください。'
                  : 'No team inbox is configured in this environment, so the ticket was recorded on this device. Keep the reference number and use the contact options below as well.'}
          </p>
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
                ? 'このご質問は担当者への確認対象としてマークされました。個別の判断は行政書士（申請取次）・弁護士など資格を持つ専門家にご相談ください。'
                : 'This question was flagged for human follow-up. For individual determinations, please consult a qualified professional (certified gyoseishoshi or lawyer).'}
            </p>
          )}
        </div>
      )}

      {hydrated && tickets.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{ja ? 'あなたのチケット（この端末）' : 'Your tickets (this device)'}</h2>
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
          {SUPPORT_EMAIL ? (
            <li>
              ✉ <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo2 hover:underline">{SUPPORT_EMAIL}</a>
            </li>
          ) : (
            <li>{ja ? '✉ メール窓口は準備中です。上のフォームをご利用ください。' : '✉ An email inbox is being set up — please use the form above for now.'}</li>
          )}
          <li>
            📅 {ja ? '個別相談の予約（人によるサポート）は近日提供予定です。' : 'Human consultation booking is coming soon.'}{' '}
            <span className="rounded-full bg-violet2/10 px-2 py-0.5 text-[10px] font-semibold text-violet2">
              {ja ? '準備中' : 'Coming soon'}
            </span>
          </li>
          <li>
            🏛 {ja
              ? '就職の公的相談：東京外国人雇用サービスセンター（無料）'
              : 'Public job-hunting help: Tokyo Employment Service Center for Foreigners (free)'}{' '}
            <a href="https://jsite.mhlw.go.jp/tokyo-foreigner/" target="_blank" rel="noopener noreferrer" className="text-indigo2 hover:underline">
              jsite.mhlw.go.jp/tokyo-foreigner ↗
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
