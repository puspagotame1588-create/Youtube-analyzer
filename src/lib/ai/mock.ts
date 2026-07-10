/**
 * Rule-based development provider. Deterministic templates over the structured
 * inputs — clearly labeled provider:'mock'; never presented as live AI.
 */

import {
  explainResultSchema,
  intentResultSchema,
  triageResultSchema,
  type AIProvider,
  type AiResponse,
  type AiTask,
} from './provider';

const FIELD_KEYWORDS: Array<{ field: 'business' | 'it' | 'hospitality' | 'foodservice' | 'realestate'; words: RegExp }> = [
  { field: 'it', words: /\b(it|software|program|engineer|developer|web|app|data|ai)\b|ＩＴ|エンジニア|プログラ|開発/i },
  { field: 'hospitality', words: /hotel|tourism|hospitality|travel|ホテル|観光|ブライダル/i },
  { field: 'foodservice', words: /restaurant|food|cafe|chef|レストラン|飲食|外食|カフェ|店長/i },
  { field: 'realestate', words: /real ?estate|property|housing|不動産|宅建/i },
  { field: 'business', words: /business|trade|office|marketing|sales|ビジネス|貿易|事務|営業|経営/i },
];

const LOCATION_KEYWORDS: Array<{ loc: 'tokyo' | 'yokohama' | 'chiba' | 'saitama' | 'kanto-any'; words: RegExp }> = [
  { loc: 'tokyo', words: /tokyo|東京/i },
  { loc: 'yokohama', words: /yokohama|横浜|kanagawa|神奈川/i },
  { loc: 'chiba', words: /chiba|千葉|narita|成田/i },
  { loc: 'saitama', words: /saitama|埼玉/i },
];

export class MockAIProvider implements AIProvider {
  async run(task: AiTask): Promise<AiResponse> {
    const start = Date.now();
    const done = <T>(data: T): AiResponse<T> => ({
      provider: 'mock',
      model: 'rule-based-dev',
      promptVersion: 'mock-1',
      data,
      latencyMs: Date.now() - start,
    });

    switch (task.task) {
      case 'intent': {
        const field = FIELD_KEYWORDS.find((f) => f.words.test(task.goalText))?.field ?? 'business';
        const location = LOCATION_KEYWORDS.find((l) => l.words.test(task.goalText))?.loc ?? 'kanto-any';
        const matched = FIELD_KEYWORDS.some((f) => f.words.test(task.goalText));
        return done(
          intentResultSchema.parse({
            field,
            location,
            confidence: matched ? 'medium' : 'low',
            needsConfirmation: true,
          }),
        );
      }
      case 'explain-route': {
        const sorted = [...task.factors].sort(
          (a, b) => (b.score * b.weight) - (a.score * a.weight),
        );
        const top = sorted[0];
        const weak = sorted[sorted.length - 1];
        const explanation =
          task.locale === 'ja'
            ? `「${task.routeName}」の評価で最も強かった要素は「${top?.factor ?? ''}」（${top?.score ?? 0}/100）です。${top?.reason ?? ''} 一方、最も弱かった要素は「${weak?.factor ?? ''}」（${weak?.score ?? 0}/100）でした。${weak?.reason ?? ''} 実現性は「${task.feasibility}」、根拠の強さは「${task.evidence}」です。${task.closeCall ? '上位ルートとの差が小さいため、どちらかが明確に優れているとは言えません。' : ''}スコアは検証済みデータと明示的なルールから計算されており、AIが数値を作ることはありません。`
            : `The strongest factor for "${task.routeName}" was ${top?.factor ?? ''} (${top?.score ?? 0}/100). ${top?.reason ?? ''} The weakest factor was ${weak?.factor ?? ''} (${weak?.score ?? 0}/100). ${weak?.reason ?? ''} Feasibility is ${task.feasibility} and evidence strength is ${task.evidence}. ${task.closeCall ? 'The top routes are close, so neither is clearly superior. ' : ''}Scores come from verified data and explicit rules — the AI never invents the numbers.`;
        return done(explainResultSchema.parse({ explanation }));
      }
      case 'support-triage': {
        const legal = /visa|permanent|residence|immigration|在留|永住|ビザ|入管/i.test(task.message);
        const tech = /error|bug|crash|エラー|バグ|動かない/i.test(task.message);
        const category = legal ? 'legal-referral' : tech ? 'technical' : 'other';
        const reply =
          task.locale === 'ja'
            ? legal
              ? '在留資格に関する個別のご質問は、行政書士など資格を持つ専門家への相談をおすすめします。一般的な情報は「日本定住ロードマップ」ページをご覧ください。担当者にも共有しました。'
              : 'お問い合わせありがとうございます。内容を確認し、担当者からご連絡します。よくある操作は各ページの「？」ガイドもご参照ください。'
            : legal
              ? 'For individual residence-status questions we recommend consulting a qualified professional (e.g. a gyoseishoshi). General information is on the Japan Settlement Roadmap page. Your message has also been shared with our team.'
              : 'Thanks for reaching out. Our team will review your message and reply. The "?" guides on each page cover common product questions.';
        return done(triageResultSchema.parse({ category, escalate: legal, reply }));
      }
    }
  }
}
