/**
 * ==================================================================
 *  PROMPT VAULT — the ONLY file you edit to manage prompts.
 *
 *  ➤ To ADD a prompt: copy any object below, paste it at the end of
 *    the `prompts` array, change the fields. That's it — the card,
 *    filters, search, and modal all update automatically.
 *
 *  ➤ Field guide:
 *    id          unique short string (no spaces) — e.g. 'my-prompt-1'
 *    title       card title (English)
 *    titleJa     card title (Japanese) — shown under the English title
 *    description 1–2 sentence summary shown on the card
 *    tool        'Claude' | 'ChatGPT' | 'Gemini' | 'Other'  (badge color)
 *    category    'Study' | 'Career' | 'Productivity' | 'Coding' | 'Writing'
 *                (new categories appear in the filter bar automatically)
 *    isPremium   false = full prompt visible · true = locked preview
 *    copies      number shown as social proof; ≥100 also gets a
 *                "POPULAR" badge (static for now — update by hand)
 *    promptText  the full prompt (use [BRACKETS] for user-replaceable parts)
 *                ⚠ For premium prompts, remember this ships inside the
 *                public JS bundle. Until real access control exists,
 *                put only the teaser in previewText and keep the full
 *                secret text OUT of this file (deliver it via your
 *                payment platform, e.g. Gumroad file download).
 *    previewText premium only — the visible teaser above the blur
 *    instructions how to use it ("paste into Claude, replace [X]…")
 * ==================================================================
 */

export const vaultConfig = {
  // ---- Payment link for premium prompts ----
  // Replace with your real Gumroad / Stripe / Ko-fi URL when ready, e.g.
  //   paymentUrl: 'https://puspagotame.gumroad.com/l/prompt-vault',
  // While it contains 'YOUR-', the unlock button shows "coming soon".
  paymentUrl: 'https://YOUR-PAYMENT-LINK.example',

  // ---- Newsletter signup ----
  // Point this at a Buttondown / Mailchimp / Formspree form action URL.
  // While it contains 'YOUR-', the box shows a friendly "launching soon".
  newsletterUrl: 'https://YOUR-NEWSLETTER-LINK.example',

  // id of the prompt spotlighted at the top of the page
  featuredId: 'interview-prep-system',
}

export const prompts = [
  {
    id: 'keigo-email-polisher',
    title: 'Keigo Email Polisher',
    titleJa: 'ビジネス敬語メール変換',
    description:
      'Turns a rough draft or casual Japanese into a natural, polite business email — with three politeness levels to choose from.',
    tool: 'Claude',
    category: 'Writing',
    isPremium: false,
    copies: 214,
    promptText: `You are a Japanese business-writing coach. Rewrite the email below as a natural Japanese business email.

Rules:
- Output THREE versions: (1) 丁寧 (standard polite), (2) ややフォーマル (to a client), (3) 社内カジュアル (to a close colleague).
- Keep the meaning identical; fix any unnatural phrasing.
- After the three versions, list any phrases you changed and why, in one line each.

My draft:
[PASTE YOUR DRAFT — Japanese or English is fine]

Recipient: [WHO — e.g. professor / client / manager]
Goal of the email: [WHAT YOU WANT TO HAPPEN]`,
    instructions:
      'Paste into Claude. Replace the three [BRACKETS] with your draft, the recipient, and your goal. Works from an English draft too — it will translate and polish at the same time. ／ Claudeに貼り付けて、[ ]の部分を自分の内容に置き換えてください。',
  },
  {
    id: 'jlpt-grammar-coach',
    title: 'JLPT Grammar Coach',
    titleJa: 'JLPT文法コーチ',
    description:
      'Drills one JLPT grammar point at a time: explanation, three example sentences, then a mini quiz that corrects your answers.',
    tool: 'ChatGPT',
    category: 'Study',
    isPremium: false,
    copies: 168,
    promptText: `Act as a strict but encouraging JLPT [N2] grammar tutor.

For the grammar point 「[GRAMMAR POINT — e.g. 〜ばかりに]」:
1. Explain the meaning and nuance in simple English (2–3 sentences).
2. Show 3 example sentences: casual, business, and written style — with furigana and English translation.
3. Quiz me with 3 fill-in-the-blank questions. Wait for my answers.
4. Grade my answers, explain every mistake, then suggest the next related grammar point to study.

Keep each step short. Never move to the next step until I answer.`,
    instructions:
      'Paste into ChatGPT (or Claude). Set your level [N2] and the [GRAMMAR POINT] you are studying. Answer the quiz in the chat — it waits for you. ／ 自分のレベルと勉強中の文法に置き換えてください。',
  },
  {
    id: 'meeting-notes-actions',
    title: 'Meeting Notes → Action Items',
    titleJa: '議事録→アクション抽出',
    description:
      'Paste messy meeting notes (JP or EN) and get a clean owner/task/deadline table plus a polite follow-up message draft.',
    tool: 'Claude',
    category: 'Productivity',
    isPremium: false,
    copies: 131,
    promptText: `You are an operations assistant. From the meeting notes below, produce:

1. A table: | Owner | Task | Deadline | Priority |
   - Infer missing deadlines as "TBD" — never invent dates.
2. "Decisions made" — bullet list, one line each.
3. "Open questions" — anything unresolved.
4. A short polite follow-up message (in [Japanese]) I can send to the participants summarizing the actions.

Meeting notes:
[PASTE NOTES — any language, any format]`,
    instructions:
      'Paste into Claude with your raw notes. Change [Japanese] to English if your team works in English. Check the table before sending the follow-up — the AI drafts, you decide. ／ 議事録を貼るだけで、タスク表とフォローアップ文が出ます。',
  },
  {
    id: 'n8n-workflow-debugger',
    title: 'n8n Workflow Debugger',
    titleJa: 'n8nワークフロー・デバッガー',
    description:
      'Systematically debugs a failing n8n workflow: reads your node setup and error, then proposes ranked fixes with test steps.',
    tool: 'Claude',
    category: 'Coding',
    isPremium: false,
    copies: 87,
    promptText: `You are an n8n automation expert. Debug my workflow step by step.

My workflow (nodes in order): [e.g. Gmail Trigger → OpenAI → IF → Google Sheets]
The node that fails: [NODE NAME]
Error message: [PASTE EXACT ERROR]
What I expected to happen: [EXPECTED BEHAVIOR]

Respond with:
1. The 3 most likely causes, ranked by probability, one line each.
2. For the #1 cause: exact fix instructions (which node, which field, what value).
3. A minimal test to confirm the fix before running the full workflow.
4. One improvement that would make this workflow more reliable long-term.`,
    instructions:
      'Paste into Claude, fill in the four [BRACKETS] from your n8n screen. The exact error message matters most — copy it completely. ／ エラーメッセージは省略せず全文コピーしてください。',
  },
  {
    id: 'youtube-study-notes',
    title: 'YouTube Video → Study Notes',
    titleJa: '動画→学習ノート変換',
    description:
      'Turns any lecture or tutorial transcript into structured study notes: key concepts, JP/EN vocabulary list, and self-test questions.',
    tool: 'Gemini',
    category: 'Study',
    isPremium: false,
    copies: 142,
    promptText: `Turn this video transcript into study notes I can review in 10 minutes.

Format:
1. TL;DR — 3 bullet points.
2. Key concepts — each with a one-line explanation in simple English and the Japanese term in parentheses where relevant.
3. Vocabulary table (for language learners): | Term | 日本語 | Example from the video |
4. 5 self-test questions (answers at the bottom, upside-down order).
5. "Watch again" — timestamps/sections worth rewatching, if identifiable.

Transcript:
[PASTE TRANSCRIPT — in Gemini you can also just paste the YouTube link]`,
    instructions:
      'Works best in Gemini (paste the YouTube URL directly). In Claude/ChatGPT, paste the transcript text instead. ／ GeminiならYouTubeのURLを貼るだけでOKです。',
  },
  {
    id: 'interview-prep-system',
    title: 'Complete 面接 Interview Prep System',
    titleJa: '日本企業・面接対策システム',
    description:
      'A full mock-interview engine for Japanese companies: generates company-specific questions, roleplays the interviewer in keigo, and scores your answers on the 4 axes HR actually uses.',
    tool: 'Claude',
    category: 'Career',
    isPremium: true,
    copies: 96,
    promptText: '', // full text delivered after purchase — do not put it here
    previewText: `You are a hiring manager at [COMPANY] interviewing a candidate for [ROLE]. Conduct a realistic Japanese job interview (新卒面接).

Phase 1 — Research: ask me 3 questions about the company/role to calibrate.
Phase 2 — Interview: ask one question at a time in polite Japanese, starting with 自己紹介…`,
    instructions:
      'The full system includes: 5 interview phases, the 逆質問 strategy module, a scoring rubric (logic ／ 熱意 ／ culture-fit ／ Japanese level), and a feedback report format. Unlock to get the complete prompt + a usage video. ／ 完全版は購入後にご利用いただけます。',
  },
  {
    id: 'entry-sheet-system',
    title: 'Entry Sheet (ES) Writing System',
    titleJa: 'エントリーシート作成システム',
    description:
      'Builds your 自己PR and ガクチカ from raw experiences: extracts your strongest episodes, structures them with STAR, and rewrites to the character limit.',
    tool: 'Claude',
    category: 'Career',
    isPremium: true,
    copies: 74,
    promptText: '', // full text delivered after purchase — do not put it here
    previewText: `You are a career advisor who has reviewed 1,000+ entry sheets for Japanese companies. Help me write a [自己PR / ガクチカ] within [400] characters.

Step 1 — Interview me: ask 5 questions, one at a time, to find my strongest concrete episode…`,
    instructions:
      'The full system includes: the 5-question episode extractor, STAR restructuring, three tone variants (堅め・標準・individuality), and a character-count trimmer that preserves your key numbers. ／ 完全版は購入後にご利用いただけます。',
  },
  {
    id: 'bilingual-rag-pack',
    title: 'Bilingual RAG Prompt Pack',
    titleJa: 'バイリンガルRAGプロンプト集',
    description:
      'Production-tested system prompts for RAG assistants that answer in Japanese from mixed JP/EN documents — with citation formatting and "I don\'t know" guardrails.',
    tool: 'Other',
    category: 'Coding',
    isPremium: true,
    copies: 58,
    promptText: '', // full text delivered after purchase — do not put it here
    previewText: `System prompt (excerpt):
You answer questions using ONLY the provided context documents. The documents may be in Japanese or English; always answer in the user's language.

Citation rules:
- After every factual claim, cite as 【source: filename · section】…`,
    instructions:
      'The pack includes: the full system prompt, a chunk-formatting template, a hallucination test set (10 questions), and JP/EN citation styles. Built from my RAG Knowledge Assistant project. ／ 完全版は購入後にご利用いただけます。',
  },
]
