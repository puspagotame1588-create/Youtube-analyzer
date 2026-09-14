# 講義レコーダー — Lecture Recorder

Record your Japanese university lectures on a phone or laptop, see **Japanese and English side by side while the teacher is talking**, and get a **full transcript, a summary and the main points** (in both languages) as soon as you press stop. Everything is filed by course and lecture number (第1回, 第2回, …).

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Dexie (IndexedDB) · OpenAI speech-to-text · Claude (translation, summary, main points)

---

## 1. Run it

```bash
cd lecture-recorder
npm install
cp .env.example .env.local     # then paste your keys (see below)
npm run dev                    # http://localhost:3000
```

Other commands:

```bash
npm run build && npm start     # production build + server
npm run lint                   # ESLint
npm run typecheck              # TypeScript
npm test                       # Vitest (formatting, export, schemas, hallucination filter)
```

### Keys

| Variable | What it is for | Without it |
| --- | --- | --- |
| `OPENAI_API_KEY` | Japanese speech-to-text (`gpt-4o-transcribe` by default) | Demo mode: sample Japanese sentences |
| `ANTHROPIC_API_KEY` | Live English translation and the post-lecture summary / main points (`claude-opus-5` by default) | Demo mode: sample English and a placeholder summary |

With no keys at all the app still runs end to end in **demo mode** so you can try the UI first. A yellow banner tells you which key is missing.

Optional overrides live in `.env.example`: `OPENAI_TRANSCRIBE_MODEL` (e.g. `gpt-4o-mini-transcribe` is cheaper), `ANTHROPIC_TRANSLATE_MODEL` (set `claude-haiku-4-5` to make the live translation cheaper), `ANTHROPIC_ANALYSIS_MODEL`.

### Use it on your phone

1. Run `npm run dev -- -H 0.0.0.0` on your laptop and open `http://<laptop-ip>:3000` on the phone (same Wi-Fi), **or** deploy to Vercel and open the URL.
2. Microphone access needs HTTPS or `localhost`. A Vercel deployment is HTTPS by default. On a LAN IP, Chrome on Android needs `chrome://flags/#unsafely-treat-insecure-origin-as-secure` for that origin.
3. "Add to Home Screen" makes it a standalone app (the manifest is included).
4. Keep the screen on while recording. The app requests a screen wake lock, but if the phone locks, browsers pause the microphone.

---

## 2. How a lecture flows through the app

```
mic ──► MediaRecorder (full take, kept for playback)
    └─► MediaRecorder restarted every 8–15 s ──► /api/transcribe (OpenAI, ja)
                                                     └─► /api/translate (Claude) ──► live JA | EN columns
stop ──► audio + segments saved to IndexedDB
     └─► /api/analyze (Claude, structured JSON) ──► title · summary · main points · topics (JA + EN)
```

- **Live chunks** are self-contained audio files (the recorder is restarted, not time-sliced) so each one can be transcribed independently. The previous Japanese text is passed as a prompt to keep terminology consistent across chunks.
- **Silence** is skipped client-side (level meter), and known speech-to-text hallucinations on quiet audio (e.g. ご視聴ありがとうございました) are dropped.
- **Analysis** sends the full transcript once and asks for a fixed JSON shape (`lib/analysis-schema.ts`) validated with Zod on both ends.
- **Storage** is local only: `courses`, `lectures` (segments + analysis) and `audio` (Blob) tables in IndexedDB. Nothing is uploaded except the audio chunks and text sent to the two APIs. Use **⤓ Markdown** on a lecture page to export it.

## 3. Folder structure

```
app/
  page.tsx                 # library (courses → lectures)
  record/page.tsx          # live recording screen
  lecture/[id]/page.tsx    # transcript / summary / main points
  api/transcribe/route.ts  # OpenAI speech-to-text
  api/translate/route.ts   # Claude live translation
  api/analyze/route.ts     # Claude summary + main points (structured output)
  api/status/route.ts      # which keys are configured (demo banner)
components/
  LiveRecorder.tsx         # recording UI + chunk pipeline
  LectureDetail.tsx        # tabs, language toggle, audio player, export
  Library.tsx              # courses, add/delete, lecture list
lib/
  recorder.ts              # ChunkedRecorder (two MediaRecorders + level meter)
  db.ts                    # Dexie schema and helpers
  analysis-schema.ts       # Zod schemas shared by client and server
  analyze-client.ts        # runs /api/analyze and stores the result
  format.ts                # time formatting, Markdown export, hallucination filter
  demo.ts                  # demo-mode data
tests/                     # Vitest unit tests
```

## 4. Cost (rough, per 90-minute lecture)

| Step | Model | Estimate |
| --- | --- | --- |
| Speech-to-text | `gpt-4o-transcribe` | about 0.5 USD (`gpt-4o-mini-transcribe`: about half) |
| Live translation | `claude-opus-5`, ~500 short calls | about 1–2 USD (`claude-haiku-4-5`: well under 0.5 USD) |
| Summary + main points | `claude-opus-5`, one call | about 0.2–0.5 USD |

## 5. Known limits

- Chunk boundaries can split a word; the summary step reads the whole transcript so it recovers, but a live line may end mid-word.
- Live English lags the speech by roughly one chunk length plus API time (about 10–15 s).
- Safari records `audio/mp4`; Chrome/Edge/Firefox record `audio/webm`. Both are accepted by the transcription API.
- Data lives in one browser profile. Clearing site data deletes recordings; export lectures you want to keep.
- Recording a teacher is personal data. Ask for permission first.
