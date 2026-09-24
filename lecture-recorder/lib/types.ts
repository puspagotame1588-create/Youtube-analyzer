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
  status: "pending" | "done" | "silent" | "error";
  error?: string;
}

/** One line of the final, high-accuracy transcript. */
export interface TranscriptSegment {
  startSec: number;
  endSec: number;
  source: string;
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

/* ---------------------------------------------------------- lecture flow -- */

/**
 * One piece of text in a flow, carrying where it came from.
 *
 * `basis` is the load-bearing field: it separates what the lecturer said from
 * what was computed from their numbers and from what the AI wrote to join the
 * lecture together. It is never collapsed into a claim about the lecturer.
 */
export interface EvidenceText {
  text: string;
  basis: "transcript" | "derived_calculation" | "ai_explanation";
  /** Ids of the transcript segments this rests on, e.g. ["s4", "s5"]. */
  sourceSegmentIds: string[];
  /** A stated qualification or an unclear passage. Never an invented probability. */
  uncertainty: string | null;
}

export type FlowDetailKind =
  | "definition"
  | "reasoning"
  | "example"
  | "calculation"
  | "qualification"
  | "student_question";

export interface FlowDetail {
  kind: FlowDetailKind;
  label: string;
  content: EvidenceText;
}

export interface FlowSection {
  id: string;
  chapterId: string;
  title: string;
  sourceSegmentIds: string[];
  /** One sentence: what this part of the lecture explains. */
  purpose: EvidenceText;
  explanation: EvidenceText[];
  connectionFromPrevious: EvidenceText | null;
  details: FlowDetail[];
  connectionToNext: EvidenceText | null;
}

export type FlowRelationshipType =
  | "next_topic"
  | "prerequisite"
  | "example_of"
  | "contrast"
  | "cause"
  | "return_to_topic";

export interface FlowRelationship {
  fromSectionId: string;
  toSectionId: string;
  type: FlowRelationshipType;
  explanation: EvidenceText;
}

export interface FlowAssignment {
  task: EvidenceText;
  /** The lecturer's own words, e.g. 「次回の授業」. */
  deadlineOriginal: string | null;
  /** Only set when the wording plus the recording date make one date certain. */
  deadlineISO: string | null;
}

export interface FlowCoverageEntry {
  segmentId: string;
  status: "represented" | "non_instructional" | "unresolved";
  sectionIds: string[];
  reason: string | null;
}

export interface LectureFlow {
  schemaVersion: "1.0";
  lectureId: string;
  /** Hash of the transcript this was built from. A mismatch means outdated. */
  transcriptRevision: string;
  outputLanguage: LectureLanguage;
  title: string;
  mainQuestions: EvidenceText[];
  overview: EvidenceText[];
  chapters: { id: string; title: string; sectionIds: string[] }[];
  sections: FlowSection[];
  relationships: FlowRelationship[];
  conclusion: EvidenceText[];
  unresolvedQuestions: EvidenceText[];
  assignments: FlowAssignment[];
  examMentions: EvidenceText[];
  coverage: FlowCoverageEntry[];
  availability: "complete_for_available_transcript" | "partial";
  warnings: string[];
  createdAt: number;
  model: string;
  promptVersion: string;
}

export type FlowJobStatus = "running" | "done" | "error" | "cancelled";

/** The state of a generation run, kept apart from the last good flow. */
export interface FlowJob {
  status: FlowJobStatus;
  /** Which of the four stages is running, for the progress display. */
  stage: "reading" | "topics" | "connecting" | "coverage";
  done: number;
  total: number;
  /** The transcript this run started from; a later transcript invalidates it. */
  transcriptRevision: string;
  outputLanguage: LectureLanguage;
  startedAt: number;
  updatedAt: number;
  error: string | null;
}
