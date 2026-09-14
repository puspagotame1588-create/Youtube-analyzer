/**
 * Demo data used when no API keys are configured, so the whole flow
 * (record → live columns → summary page) can be tried without spending money.
 */

const DEMO_JA = [
  "今日はマーケティングの基本概念について説明します。",
  "まず、マーケティングとは顧客のニーズを理解し、価値を提供するプロセスです。",
  "4Pという考え方があります。製品、価格、流通、そしてプロモーションです。",
  "製品戦略では、顧客が本当に求めている価値を明確にすることが重要です。",
  "価格設定はコストだけでなく、競合や顧客の知覚価値も考慮する必要があります。",
  "次回はSTP、つまりセグメンテーション、ターゲティング、ポジショニングを扱います。",
  "レポートの締め切りは来週の金曜日です。忘れないでください。",
];

const DEMO_EN = [
  "Today I will explain the basic concepts of marketing.",
  "First, marketing is the process of understanding customer needs and delivering value.",
  "There is a framework called the 4Ps: product, price, place, and promotion.",
  "In product strategy, it is important to clarify the value customers really want.",
  "Pricing must consider not only cost but also competitors and customers' perceived value.",
  "Next time we will cover STP: segmentation, targeting, and positioning.",
  "The report deadline is next Friday. Please don't forget.",
];

let cursor = 0;

export function demoTranscribe(): string {
  const text = DEMO_JA[cursor % DEMO_JA.length];
  cursor += 1;
  return text;
}

export function demoTranslate(ja: string): string {
  const i = DEMO_JA.indexOf(ja);
  if (i >= 0) return DEMO_EN[i];
  return `[demo] ${ja}`;
}

export function demoAnalysis(input: {
  course: string;
  lectureNumber: number;
  segments: { ja: string; en: string }[];
}) {
  const firstJa = input.segments[0]?.ja ?? "";
  const firstEn = input.segments[0]?.en ?? "";
  return {
    title: {
      ja: `${input.course || "講義"} 第${input.lectureNumber}回（デモ）`,
      en: `${input.course || "Lecture"} #${input.lectureNumber} (demo)`,
    },
    summary: {
      ja: `【デモモード】APIキーが設定されていないため、これはサンプルの要約です。講義は「${firstJa}」で始まり、合計${input.segments.length}個の発話区間が記録されました。.env.local にキーを追加すると、本物の要約が生成されます。`,
      en: `[Demo mode] No API keys are configured, so this is a sample summary. The lecture began with "${firstEn}" and ${input.segments.length} spoken segments were recorded. Add keys to .env.local to get a real summary.`,
    },
    mainPoints: input.segments.slice(0, 5).map((s) => ({ ja: s.ja, en: s.en })),
    topics: [
      {
        heading: { ja: "デモのトピック", en: "Demo topic" },
        detail: {
          ja: "キーを設定すると、講義の流れに沿ったトピックがここに表示されます。",
          en: "Once keys are set, the topics in the order the teacher covered them appear here.",
        },
      },
    ],
  };
}
