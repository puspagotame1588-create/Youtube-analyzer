/** Language a lecture is delivered in. The UI itself is always Japanese. */
export type LectureLanguage = "ja" | "en";

export type LectureStatus =
  | "recording"
  | "recorded"
  | "transcribing"
  | "analyzing"
  | "done"
  | "error";

export interface Course {
  id: string;
  /** 科目名 */
  name: string;
  /** 担当教員 */
  teacher: string;
  color: string;
  language: LectureLanguage;
  /**
   * 専門用語リスト. Sent to the speech model as recognition hints and to the
   * writing model as the preferred spelling of each term.
   */
  keywords: string[];
  createdAt: number;
}

/** One live caption line, produced while the lecture is still running. */
export interface LiveSegment {
  idx: number;
  startSec: number;
  endSec: number;
  /** Text in the lecture's own language. */
  source: string;
  /** Translation into the other language. Empty until it arrives. */
  translation: string;
  status: "pending" | "done" | "silent" | "error";
  error?: string;
}

/** One line of the final, high-accuracy transcript. */
export interface TranscriptSegment {
  startSec: number;
  endSec: number;
  source: string;
  translation: string;
}

export interface TranscriptFile {
  language: LectureLanguage;
  segments: TranscriptSegment[];
  /** true when it came from the accurate pass, false when live captions were reused. */
  refined: boolean;
  createdAt: number;
}

export interface Lecture {
  id: string;
  courseId: string;
  /** 第N回 */
  number: number;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  language: LectureLanguage;
  status: LectureStatus;
  createdAt: number;
  updatedAt: number;
  durationSec: number;
  masterBytes: number;
  audioMime: string;
  /** Progress of the finalize pipeline, shown in the UI. */
  progress?: { step: string; done: number; total: number } | null;
  error?: string | null;
  /** Informational message about how the lecture was processed. Not a failure. */
  note?: string | null;
  /** Number of live chunks that failed to transcribe and are awaiting retry. */
  pendingChunks?: number;
}

/* ------------------------------------------------------------- AI output -- */

export interface Term {
  term: string;
  reading: string;
  meaning: string;
  example: string;
}

export interface TopicPoint {
  heading: string;
  points: string[];
  startSec: number | null;
}

export interface Assignment {
  what: string;
  due: string;
  quote: string;
}

export interface ExamTopic {
  topic: string;
  /** "teacher" = the teacher said it. "inferred" = the AI's own guess. */
  basis: "teacher" | "inferred";
  quote: string;
}

export interface Notes {
  title: string;
  /** 3–4 sentence overview. */
  overview: string;
  /** Detailed multi-paragraph summary. */
  detailed: string;
  topics: TopicPoint[];
  terms: Term[];
  assignments: Assignment[];
  examTopics: ExamTopic[];
  reviewQuestions: { question: string; answer: string }[];
  /** Anything the model could not make out. Never silently dropped. */
  unclear: string[];
  createdAt: number;
  model: string;
}

/** One passage the teacher flagged as worth studying. */
export interface Highlight {
  startSec: number;
  endSec: number;
  /** The teacher's own words, verbatim from the transcript. */
  quote: string;
  /** The cue phrase that drew attention to it, e.g. 試験. */
  cue: string;
  category: "exam" | "important" | "memorize" | "assignment" | "caution";
  /** What to actually study, written from the surrounding explanation. */
  point: string;
}

export interface Highlights {
  items: Highlight[];
  /** Lines the keyword scan flagged, before the AI removed false positives. */
  scanned: number;
  createdAt: number;
  model: string;
}

export interface Flashcards {
  cards: { front: string; back: string; hint: string }[];
  createdAt: number;
  model: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  /** Timestamps in the lecture the answer relied on. */
  citations?: number[];
  at: number;
}

export interface MaterialFile {
  name: string;
  storedAs: string;
  bytes: number;
  chars: number;
  addedAt: number;
}

export interface MaterialIndex {
  files: MaterialFile[];
}
