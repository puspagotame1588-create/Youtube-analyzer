/**
 * A synthetic 90-minute lecture, long enough that no single request could
 * carry it. Used to check that chunking stays bounded, keeps segment ids
 * stable across boundaries, and still reaches the assignment at the very end.
 */

import type { TranscriptFile } from "@/lib/types";

const TOPICS = [
  "需要曲線", "供給曲線", "market equilibrium", "価格弾力性",
  "消費者余剰", "生産者余剰", "外部性", "公共財",
];

/** Roughly ten seconds of speech per segment, as the recorder produces. */
export function makeLongTranscript(segmentCount = 540): TranscriptFile {
  const segments = Array.from({ length: segmentCount }, (_, i) => {
    const topic = TOPICS[Math.floor((i / segmentCount) * TOPICS.length) % TOPICS.length];
    // Lengths vary the way real speech does, so packing by characters is
    // actually exercised rather than degenerating into a fixed segment count.
    const repeat = 1 + (i % 5);
    return {
      startSec: i * 10,
      endSec: i * 10 + 10,
      source:
        i === 0
          ? "今日は需要と供給の関係について考えます。"
          : i === segmentCount - 1
            ? "課題は、需要曲線の傾きが変わる場合の均衡価格を計算することです。提出期限は来週の金曜日です。"
            : `${topic}について説明します。${"具体的な例を挙げて考えましょう。".repeat(repeat)}`,
    };
  });
  return { language: "ja", refined: true, createdAt: 1_700_000_000_000, segments };
}
