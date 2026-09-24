/**
 * The worked example from the Lecture Flow specification.
 *
 * Synthetic demonstration material, not a real recording. It exists so the
 * validator, the coverage audit and the export can be exercised end to end
 * without a model: `demoFlow` is what a correct generation should look like
 * for `demoTranscript`.
 */

import type { LectureFlow, TranscriptFile } from "@/lib/types";

const line = (startSec: number, endSec: number, source: string) => ({
  startSec,
  endSec,
  source,
});

export const demoTranscript: TranscriptFile = {
  language: "ja",
  refined: true,
  createdAt: 1_700_000_000_000,
  segments: [
    line(0, 45, "今日は、売上が増えれば利益も必ず増えるのか、という問題を考えます。結論を先に言うと、必ずしもそうではありません。売上だけではなく、費用を見る必要があります。"),
    line(45, 95, "売上は、販売価格に販売数量を掛けたものです。利益は、売上から費用を引いたものです。たくさん売れたという情報だけでは、いくら利益が出たかは分かりません。"),
    line(95, 160, "費用を固定費と変動費に分けます。固定費は、今回考える期間と営業規模の範囲では、販売数量が変わっても変わらない費用です。家賃などが例です。変動費は販売数量に応じて変わる費用で、材料費などがあります。"),
    line(160, 230, "ある店の商品が一個500円、材料などの一個当たり変動費が300円、月の固定費が10万円だとします。一個売ると、固定費の回収と利益に使える金額は200円です。これを一個当たりの限界利益と呼びます。この条件では500個売ると10万円になり、固定費をちょうど回収できます。"),
    line(230, 315, "では価格を450円に下げましょう。一個当たり変動費が変わらないなら、限界利益は150円です。損益分岐点は10万円割る150円で約666.7個、整数なら667個です。値下げ前に600個売っていた場合、売上30万円、利益2万円です。値下げ後に700個売れたら、売上は31万5000円ですが、利益は5000円です。"),
    line(315, 360, "学生から、値下げはしない方がよいのか、という質問がありました。そうとは限りません。この例の条件では800個売れれば以前と同じ2万円の利益になります。値下げの判断には、何個売れる見込みがあるかが重要です。"),
    line(360, 400, "ただし、今日は固定費と一個当たり変動費が一定だと仮定しています。販売量が大幅に増えて追加の設備や人員が必要になる場合、この計算の条件も見直す必要があります。"),
    line(400, 435, "今日のポイントは、売上の増加と利益の増加は同じではないということです。価格、数量、費用を一緒に考えてください。課題は、この例で価格を480円にしたとき、600個の販売で利益がいくらになるかを計算することです。提出期限は次回の授業です。"),
  ],
};

const said = (text: string, ids: string[], uncertainty: string | null = null) => ({
  text,
  basis: "transcript" as const,
  sourceSegmentIds: ids,
  uncertainty,
});
const derived = (text: string, ids: string[]) => ({
  text,
  basis: "derived_calculation" as const,
  sourceSegmentIds: ids,
  uncertainty: null,
});
const editorial = (text: string, ids: string[]) => ({
  text,
  basis: "ai_explanation" as const,
  sourceSegmentIds: ids,
  uncertainty: null,
});

const section = (
  n: number,
  chapterId: string,
  title: string,
  ids: string[],
  purpose: string,
  explanation: string,
) => ({
  id: `sec${n}`,
  chapterId,
  title,
  sourceSegmentIds: ids,
  purpose: said(purpose, ids),
  explanation: [said(explanation, ids)],
  connectionFromPrevious:
    n === 1 ? null : editorial(`前の部分を受けて${title}に進みます。`, ids),
  details: [],
  connectionToNext: null as null | ReturnType<typeof editorial>,
});

export const demoFlow: LectureFlow = {
  schemaVersion: "1.0",
  lectureId: "demo",
  transcriptRevision: "fixture",
  outputLanguage: "ja",
  title: "売上が増えても、利益が減るのはなぜ？",
  mainQuestions: [
    said("たくさん売れれば、会社に残るお金も必ず増えるのでしょうか？", ["s1"]),
  ],
  overview: [
    said(
      "この講義では、まず売上と利益の違いを確認し、費用を固定費と変動費に分けて、値下げの例で販売数量が増えても利益が減る場合があることを示します。",
      ["s1", "s2", "s3", "s4", "s5", "s6", "s7"],
    ),
  ],
  chapters: [
    { id: "ch1", title: "問いと基本の区別", sectionIds: ["sec1", "sec2", "sec3"] },
    { id: "ch2", title: "限界利益と値下げの計算", sectionIds: ["sec4", "sec5", "sec6"] },
    { id: "ch3", title: "前提と結論", sectionIds: ["sec7", "sec8"] },
  ],
  sections: [
    section(1, "ch1", "最初の問い：売れれば利益も増える？", ["s1"],
      "講義全体で考える問題を示します。",
      "講師は「売上が増えれば利益も増える」という考えを出発点にしています。しかし利益を知るには費用も確認しなければなりません。"),
    section(2, "ch1", "売上と利益を区別する", ["s2"],
      "売上と利益の違いを定義します。",
      "売上は商品を売って得た金額、利益はそこから費用を引いて残る金額です。"),
    section(3, "ch1", "費用を二つに分ける", ["s3"],
      "固定費と変動費の違いを説明します。",
      "固定費は販売数量が変わっても一定の費用、変動費は販売数量に応じて変わる費用です。"),
    {
      ...section(4, "ch2", "一個売ったときに残る200円を考える", ["s4"],
        "限界利益と損益分岐点を導入します。",
        "販売価格500円から一個当たり変動費300円を引くと200円が残ります。これが一個当たりの限界利益です。"),
      details: [
        {
          kind: "calculation" as const,
          label: "一個当たり限界利益",
          content: derived("500 − 300 ＝ 200", ["s4"]),
        },
        {
          kind: "calculation" as const,
          label: "固定費を回収できる数量",
          content: derived("100,000 ÷ 200 ＝ 500", ["s4"]),
        },
      ],
    },
    {
      ...section(5, "ch2", "値下げ後は売上が増えたのに、利益が減る", ["s4", "s5"],
        "値下げが利益に与える影響を計算します。",
        "価格を450円に下げると限界利益は150円に減り、損益分岐点は667個になります。"),
      details: [
        {
          kind: "calculation" as const,
          label: "値下げ後の利益",
          content: derived("(450 − 300) × 700 − 100,000 ＝ 5,000", ["s4", "s5"]),
        },
      ],
    },
    {
      ...section(6, "ch2", "学生の質問：値下げはしない方がよい？", ["s6"],
        "値下げの是非についての質問に答えます。",
        "講師の答えは「そうとは限らない」です。同じ条件で800個売れれば値下げ前と同じ利益になります。"),
      details: [
        {
          kind: "student_question" as const,
          label: "学生の質問",
          content: said("値下げはしない方がよいのか、という質問がありました。", ["s6"]),
        },
        {
          kind: "calculation" as const,
          label: "800個売れた場合の利益",
          content: derived("150 × 800 − 100,000 ＝ 20,000", ["s6"]),
        },
      ],
    },
    {
      ...section(7, "ch3", "計算の前提を確認する", ["s7"],
        "この計算が成り立つ条件を確認します。",
        "固定費と一個当たり変動費が一定だと仮定しています。販売数量が大幅に増える場合は見直しが必要です。"),
      details: [
        {
          kind: "qualification" as const,
          label: "前提",
          content: said(
            "固定費と一個当たり変動費が一定だと仮定しています。",
            ["s7"],
            "設備や人員の追加が必要になる場合は条件が変わります。",
          ),
        },
      ],
    },
    section(8, "ch3", "結論と課題", ["s8"],
      "講義の結論と課題を示します。",
      "売上の増加と利益の増加は同じではありません。価格、数量、費用を一緒に確認してください。"),
  ],
  relationships: [
    {
      fromSectionId: "sec4",
      toSectionId: "sec5",
      type: "prerequisite",
      explanation: editorial("限界利益の考え方を使って値下げの影響を計算します。", ["s4", "s5"]),
    },
    {
      fromSectionId: "sec5",
      toSectionId: "sec6",
      type: "contrast",
      explanation: editorial("値下げが不利に見える結果に対する反論です。", ["s5", "s6"]),
    },
  ],
  conclusion: [said("売上の増加と利益の増加は同じではありません。", ["s8"])],
  unresolvedQuestions: [
    said("販売数量が大幅に増えた場合の費用は、この講義では扱っていません。", ["s7"]),
  ],
  assignments: [
    {
      task: said("価格を480円にした場合、600個販売したときの利益を計算する。", ["s8"]),
      deadlineOriginal: "次回の授業",
      deadlineISO: null,
    },
  ],
  examMentions: [],
  coverage: [
    { segmentId: "s1", status: "represented", sectionIds: ["sec1"], reason: null },
    { segmentId: "s2", status: "represented", sectionIds: ["sec2"], reason: null },
    { segmentId: "s3", status: "represented", sectionIds: ["sec3"], reason: null },
    { segmentId: "s4", status: "represented", sectionIds: ["sec4", "sec5"], reason: null },
    { segmentId: "s5", status: "represented", sectionIds: ["sec5"], reason: null },
    { segmentId: "s6", status: "represented", sectionIds: ["sec6"], reason: null },
    { segmentId: "s7", status: "represented", sectionIds: ["sec7"], reason: null },
    { segmentId: "s8", status: "represented", sectionIds: ["sec8"], reason: null },
  ],
  availability: "complete_for_available_transcript",
  warnings: [],
  createdAt: 1_700_000_000_000,
  model: "fixture",
  promptVersion: "flow-1",
};
