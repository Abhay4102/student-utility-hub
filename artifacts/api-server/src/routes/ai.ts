import { Router } from "express";
import { Buffer } from "node:buffer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, detectAudioFormat, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";
import { YoutubeTranscript } from "youtube-transcript";

const YT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

interface YtCaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  name?: { simpleText?: string };
}

interface YtMeta {
  title?: string;
  description?: string;
  author?: string;
  lengthSeconds?: string;
  captionTracks: YtCaptionTrack[];
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
}

const YT_COMMON_HEADERS = {
  "User-Agent": YT_UA,
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Cookie": "CONSENT=YES+cb.20210328-17-p0.en+FX+000; SOCS=CAI",
} as const;

async function fetchYoutubeMeta(videoId: string): Promise<YtMeta> {
  const urls = [
    `https://www.youtube.com/watch?v=${videoId}&hl=en&has_verified=1&bpctr=9999999999`,
    `https://m.youtube.com/watch?v=${videoId}&hl=en`,
  ];

  let html = "";
  let lastErr: unknown = null;
  for (const url of urls) {
    try {
      const resp = await fetch(url, { headers: YT_COMMON_HEADERS });
      if (!resp.ok) {
        lastErr = new Error(`YouTube page returned ${resp.status}`);
        continue;
      }
      html = await resp.text();
      if (html.includes("ytInitialPlayerResponse")) break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!html) throw (lastErr as Error) || new Error("Could not fetch YouTube page");

  const match =
    html.match(/var ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;\s*(?:var|<\/script>)/) ||
    html.match(/ytInitialPlayerResponse"\s*\)\s*\|\|\s*(\{[\s\S]+?\})\s*;/) ||
    html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;/);
  if (!match) throw new Error("Could not find player response");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    throw new Error("Could not parse player response");
  }

  const videoDetails = (parsed.videoDetails as Record<string, unknown> | undefined) || {};
  const captions = (parsed.captions as Record<string, unknown> | undefined) || {};
  const tracklist = (captions.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined) || {};
  const captionTracks = (tracklist.captionTracks as YtCaptionTrack[] | undefined) || [];

  return {
    title: typeof videoDetails.title === "string" ? videoDetails.title : undefined,
    description: typeof videoDetails.shortDescription === "string" ? videoDetails.shortDescription : undefined,
    author: typeof videoDetails.author === "string" ? videoDetails.author : undefined,
    lengthSeconds: typeof videoDetails.lengthSeconds === "string" ? videoDetails.lengthSeconds : undefined,
    captionTracks,
  };
}

async function fetchCaptionText(track: YtCaptionTrack): Promise<string> {
  const url = `${track.baseUrl}&fmt=json3`;
  const resp = await fetch(url, { headers: { "User-Agent": YT_UA } });
  if (!resp.ok) throw new Error(`Caption fetch returned ${resp.status}`);
  const data = (await resp.json()) as { events?: Array<{ segs?: Array<{ utf8?: string }> }> };
  const parts: string[] = [];
  for (const ev of data.events || []) {
    for (const seg of ev.segs || []) {
      if (seg.utf8) parts.push(seg.utf8);
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").replace(/\[.*?\]/g, "").trim();
}

function pickBestCaptionTrack(tracks: YtCaptionTrack[], preferredLangs: string[] = ["en", "hi"]): YtCaptionTrack | null {
  if (tracks.length === 0) return null;
  for (const lang of preferredLangs) {
    const manual = tracks.find((t) => t.languageCode === lang && t.kind !== "asr");
    if (manual) return manual;
  }
  for (const lang of preferredLangs) {
    const auto = tracks.find((t) => t.languageCode === lang);
    if (auto) return auto;
  }
  const anyManual = tracks.find((t) => t.kind !== "asr");
  return anyManual || tracks[0];
}

async function fetchYoutubeMetaInnertube(videoId: string): Promise<YtMeta> {
  const resp = await fetch(
    "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip",
        "X-YouTube-Client-Name": "3",
        "X-YouTube-Client-Version": "19.09.37",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "19.09.37",
            androidSdkVersion: 34,
            hl: "en",
            gl: "US",
          },
        },
        videoId,
      }),
    },
  );
  if (!resp.ok) throw new Error(`InnerTube returned ${resp.status}`);
  const data = (await resp.json()) as Record<string, unknown>;
  const videoDetails = (data.videoDetails as Record<string, unknown> | undefined) || {};
  const captions = (data.captions as Record<string, unknown> | undefined) || {};
  const tracklist = (captions.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined) || {};
  const captionTracks = (tracklist.captionTracks as YtCaptionTrack[] | undefined) || [];

  return {
    title: typeof videoDetails.title === "string" ? videoDetails.title : undefined,
    description: typeof videoDetails.shortDescription === "string" ? videoDetails.shortDescription : undefined,
    author: typeof videoDetails.author === "string" ? videoDetails.author : undefined,
    lengthSeconds: typeof videoDetails.lengthSeconds === "string" ? videoDetails.lengthSeconds : undefined,
    captionTracks,
  };
}

async function getYoutubeTranscriptRobust(videoId: string): Promise<{
  transcript: string;
  title?: string;
  description?: string;
  source: "captions" | "description";
}> {
  let meta: YtMeta | null = null;
  try {
    meta = await fetchYoutubeMetaInnertube(videoId);
  } catch {
    /* try web scrape */
  }
  if (!meta || (meta.captionTracks.length === 0 && !meta.description)) {
    try {
      const webMeta = await fetchYoutubeMeta(videoId);
      if (!meta) {
        meta = webMeta;
      } else {
        if (webMeta.captionTracks.length > 0) meta.captionTracks = webMeta.captionTracks;
        if (!meta.description && webMeta.description) meta.description = webMeta.description;
        if (!meta.title && webMeta.title) meta.title = webMeta.title;
        if (!meta.author && webMeta.author) meta.author = webMeta.author;
      }
    } catch { /* ignore */ }
  }

  if (meta && meta.captionTracks.length > 0) {
    const track = pickBestCaptionTrack(meta.captionTracks);
    if (track) {
      try {
        const txt = await fetchCaptionText(track);
        if (txt && txt.length > 30) {
          return { transcript: txt, title: meta.title, description: meta.description, source: "captions" };
        }
      } catch { /* fall through */ }
    }
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const txt = segments.map((s) => decodeHtmlEntities(s.text)).join(" ").replace(/\s+/g, " ").trim();
    if (txt && txt.length > 30) {
      return { transcript: txt, title: meta?.title, description: meta?.description, source: "captions" };
    }
  } catch { /* fall through */ }

  if (meta && meta.description && meta.description.trim().length > 60) {
    const enriched = `Video title: ${meta.title || "Untitled"}\nChannel: ${meta.author || "Unknown"}\n\nDescription:\n${meta.description}`;
    return { transcript: enriched, title: meta.title, description: meta.description, source: "description" };
  }

  throw new Error("No captions or description available");
}

const router = Router();

type AskMode = "standard" | "concise" | "detailed" | "step" | "exam" | "eli12";

const MODE_INSTRUCTIONS: Record<AskMode, string> = {
  standard: "Provide a clear, well-structured answer with examples.",
  concise: "Be brief and direct. Aim for a tight answer — at most 5–8 sentences or a short bullet list. Skip preamble.",
  detailed: "Give a thorough, in-depth explanation. Include background context, multiple worked examples, common misconceptions, and a short summary.",
  step: "Break the solution into clearly numbered steps. Show every step's reasoning. End with the final answer on its own line as **Answer: …**.",
  exam: "Answer in exam-ready style. Be precise, well-organised, and include keywords examiners look for. End with a tight 'Mark scheme highlights' bullet list.",
  eli12: "Explain in very simple language suitable for a 12-year-old student. Use friendly analogies, short sentences, and avoid jargon (or explain it when you must use it).",
};

function buildStudyPrompt(mode: AskMode = "standard", subject?: string): string {
  const subjectLine = subject && subject !== "General"
    ? `The student's subject focus is **${subject}**. Tailor terminology, examples, and notation accordingly.`
    : "Subject: general academic study.";
  return `You are TREO TOOL'S Study Assistant — a sharp, encouraging tutor for students.

${subjectLine}

Mode: ${mode.toUpperCase()} — ${MODE_INSTRUCTIONS[mode]}

Core rules:
- Only answer academic study questions (science, math, history, literature, languages, geography, economics, technology, programming, exam prep, etc.). For off-topic asks, politely steer back to studies.
- Be accurate first, friendly second. If you are unsure, say so clearly rather than guessing.
- Format with markdown: ## sub-headings, **bold key terms**, bullet points, numbered steps.
- Math: write equations in plain text using symbols × ÷ ² ³ √ π ∫ Σ ≤ ≥ ≠ → ↔. Place each major equation on its own line. Do NOT wrap math in code fences.
- Code blocks (\`\`\`) are ONLY for real programming code (Python, JS, C++, SQL, etc.), never for math or prose.
- When showing a worked example, label it "**Example:**" and walk through it step by step.
- Never invent citations or fake URLs. If a fact needs a citation, name the source generically (e.g. "according to most general-physics textbooks").
- Always finish with a one-line **Key takeaway:** when the answer is more than a paragraph.`;
}

type NotesFormat = "outline" | "cornell" | "bullets" | "flashcards" | "mindmap" | "summary";
type NotesDetail = "brief" | "standard" | "detailed" | "exam";

const FORMAT_INSTRUCTIONS: Record<NotesFormat, string> = {
  outline: `Structure as a classic hierarchical outline:
# {Topic}
## 1. Section
### 1.1 Sub-section
- bullet points with **bold key terms**
## 2. Next section …
End with "## Quick Revision" — 5–8 one-line takeaways.`,
  cornell: `Structure as Cornell-style notes:
# {Topic}
## Cues / Key Questions
- Short prompt questions in the left margin style, one per line.
## Notes
- The main body of facts, definitions and explanations with **bold key terms** and sub-headings.
## Summary
- A tight 3–5 sentence summary at the bottom.`,
  bullets: `Structure as a bullet-only scannable summary:
# {Topic}
## Key Points
- One idea per bullet, **bold** the key term, then a colon and the explanation.
- Use indented sub-bullets for supporting detail.
## Formulas / Definitions (if relevant)
## Quick Revision
- 5–8 final one-liners.`,
  flashcards: `Generate flashcards for active recall:
# {Topic}
## Flashcards
Format each card EXACTLY as:
**Q1.** Question text?
**A.** Answer text.

**Q2.** …
**A.** …

Produce 12–20 cards covering definitions, facts, formulas and "explain why" prompts. After the cards, add a short "## Study Tip" section.`,
  mindmap: `Structure as a text-based mind map:
# {Topic}
Use indentation with bullets and sub-bullets to show the branching structure:
- Central concept
  - Branch 1: **Key idea**
    - sub-point
    - sub-point
  - Branch 2: **Key idea**
    - …
End with "## Connections" — 3–5 lines describing how the branches link.`,
  summary: `Write a tight study summary:
# {Topic}
## Overview (3–5 sentences)
## Key Concepts (bulleted)
## Important Formulas / Dates / Definitions (if relevant)
## In a Nutshell
A single dense paragraph students can re-read before an exam.`,
};

const DETAIL_INSTRUCTIONS: Record<NotesDetail, string> = {
  brief: "Keep it very short — fit on one screen. Skip background; focus on must-know facts.",
  standard: "Comprehensive but scannable — a student should revise from this in 5 minutes.",
  detailed: "Be thorough. Include background, definitions, derivations / reasoning, multiple examples, and common mistakes.",
  exam: "Exam-prep mode: highlight exactly what tends to appear on exams, include high-yield definitions, marking-scheme phrasing, and worked example questions with answers.",
};

function buildNotesPrompt(
  format: NotesFormat = "outline",
  detail: NotesDetail = "standard",
  subject?: string,
  level?: string,
  includeQuestions = false,
): string {
  const ctx: string[] = [];
  if (subject && subject !== "General") ctx.push(`Subject: **${subject}**.`);
  if (level && level !== "Any") ctx.push(`Student level: **${level}** — pitch the language and depth accordingly.`);
  const ctxBlock = ctx.length ? `\n${ctx.join(" ")}\n` : "";

  const qBlock = includeQuestions
    ? `\nAt the very end, add a separate "## Practice Questions" section with 5 well-chosen questions (mix of recall, understanding, and application). Then a "## Answers" section with brief model answers.\n`
    : "";

  return `You are TREO TOOL'S expert study-notes writer. Produce excellent revision-ready notes.
${ctxBlock}
Format requirement:
${FORMAT_INSTRUCTIONS[format]}

Detail level: ${detail.toUpperCase()} — ${DETAIL_INSTRUCTIONS[detail]}
${qBlock}
Strict rules:
- Output ONLY the notes — no preamble like "Here are your notes" and no closing remarks.
- Format STRICTLY as markdown.
- Use plain-text math symbols (× ÷ ² ³ √ π ∫ Σ ≤ ≥ →). Never wrap math in code fences.
- Use code fences ONLY for real programming code.
- Be factually accurate; if a fact is contested or you are unsure, omit it rather than inventing it.`;
}

router.post("/ai/ask", async (req, res) => {
  const { question, history, imageBase64, imageMimeType, mode, subject } = req.body as {
    question: string;
    history?: { role: "user" | "assistant"; content: string }[];
    imageBase64?: string;
    imageMimeType?: string;
    mode?: AskMode;
    subject?: string;
  };

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    if (!imageBase64) {
      res.status(400).json({ error: "Question or image is required" });
      return;
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const userText = (question || "").trim() || "Please analyze this image and explain everything study-relevant in it.";

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: userText }];

  if (imageBase64) {
    const mime = imageMimeType || "image/png";
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mime};base64,${imageBase64}` },
    });
  }

  const safeMode: AskMode = mode && MODE_INSTRUCTIONS[mode] ? mode : "standard";
  const maxTokens = safeMode === "detailed" || safeMode === "exam" ? 4096 : safeMode === "concise" ? 1024 : 2560;

  const messages = [
    { role: "system" as const, content: buildStudyPrompt(safeMode, subject) },
    ...((history || []).slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }))),
    { role: "user" as const, content: userContent },
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: maxTokens,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      stream: true,
    });

    req.on("close", () => {
      try { stream.controller.abort(); } catch { /* noop */ }
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err, "AI stream error");
    try {
      res.write(`data: ${JSON.stringify({ error: "Failed to get answer. Please try again." })}\n\n`);
      res.end();
    } catch { /* client disconnected */ }
  }
});

router.post("/ai/transcribe", async (req, res) => {
  const { audioBase64 } = req.body as {
    audioBase64?: string;
    format?: string;
  };

  if (!audioBase64) {
    res.status(400).json({ error: "Audio is required" });
    return;
  }

  try {
    const buffer = Buffer.from(audioBase64, "base64");
    const detected = detectAudioFormat(buffer);

    let usableBuffer: Buffer = buffer;
    let usableFormat: "wav" | "mp3" | "webm" = "webm";

    if (detected === "wav" || detected === "mp3" || detected === "webm") {
      usableFormat = detected;
    } else {
      const converted = await ensureCompatibleFormat(buffer);
      usableBuffer = converted.buffer as Buffer;
      usableFormat = converted.format;
    }

    const text = await speechToText(usableBuffer as Buffer<ArrayBuffer>, usableFormat);
    res.json({ text });
  } catch (err) {
    req.log.error(err, "Transcription error");
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

router.post("/ai/notes", async (req, res) => {
  const { topic, sourceText, format, detail, subject, level, includeQuestions } = req.body as {
    topic?: string;
    sourceText?: string;
    format?: NotesFormat;
    detail?: NotesDetail;
    subject?: string;
    level?: string;
    includeQuestions?: boolean;
  };

  if ((!topic || topic.trim().length === 0) && (!sourceText || sourceText.trim().length === 0)) {
    res.status(400).json({ error: "Topic or source text is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const safeFormat: NotesFormat = format && FORMAT_INSTRUCTIONS[format] ? format : "outline";
  const safeDetail: NotesDetail = detail && DETAIL_INSTRUCTIONS[detail] ? detail : "standard";
  const maxTokens = safeDetail === "detailed" || safeDetail === "exam" ? 5000 : safeDetail === "brief" ? 1500 : 3500;

  const userPrompt = sourceText
    ? `Create study notes from this source material${topic ? ` (topic label: "${topic}")` : ""}. Source:\n\n${sourceText.slice(0, 18000)}`
    : `Create study notes on the topic: ${topic}`;

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: maxTokens,
      messages: [
        { role: "system", content: buildNotesPrompt(safeFormat, safeDetail, subject, level, !!includeQuestions) },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    req.on("close", () => {
      try { stream.controller.abort(); } catch { /* noop */ }
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err, "Notes stream error");
    try {
      res.write(`data: ${JSON.stringify({ error: "Failed to generate notes" })}\n\n`);
      res.end();
    } catch { /* client disconnected */ }
  }
});

/* -------------------- PARAPHRASER -------------------- */

type ParaphraseTone = "academic" | "simple" | "fluent" | "formal" | "creative" | "shorten" | "expand";
type ParaphraseStrength = "light" | "medium" | "heavy";

const TONE_INSTRUCTIONS: Record<ParaphraseTone, string> = {
  academic: "Use formal academic prose suitable for essays, research papers and dissertations. Prefer precise vocabulary, complete sentences, and an objective third-person voice. Avoid contractions and colloquialisms.",
  simple: "Rewrite in plain, clear English that a 12-year-old can easily understand. Short sentences, common words, no jargon.",
  fluent: "Improve clarity, grammar and natural sentence flow while keeping the original tone. The result should read smoothly without sounding robotic.",
  formal: "Use a polished, formal register suitable for business or official correspondence. Avoid contractions and informal language.",
  creative: "Rewrite with vivid, engaging language — varied sentence structure, fresh word choices, and a confident, lively voice — while keeping all factual content intact.",
  shorten: "Condense the text to roughly half its length while preserving every important fact. Cut filler words, redundancy and weak hedging.",
  expand: "Expand the text to roughly 1.5x its length by adding clarifying detail, smoother transitions and richer explanation. Do not invent facts.",
};

const STRENGTH_INSTRUCTIONS: Record<ParaphraseStrength, string> = {
  light:  "Make only minor changes — fix awkward phrasing and improve a few word choices. The output should clearly resemble the original.",
  medium: "Substantially rewrite sentences and vary word choice and structure, while keeping every fact and idea intact.",
  heavy:  "Aggressively reword and restructure. Different sentence order, different vocabulary, different rhythm — but the same meaning, no added or removed facts.",
};

function buildParaphrasePrompt(tone: ParaphraseTone, strength: ParaphraseStrength): string {
  return `You are an expert academic editor and paraphrasing engine for TREO TOOL'S.

Tone: **${tone.toUpperCase()}** — ${TONE_INSTRUCTIONS[tone]}

Rewrite strength: **${strength.toUpperCase()}** — ${STRENGTH_INSTRUCTIONS[strength]}

Strict rules:
- Output ONLY the rewritten text. No preamble like "Here is the paraphrased version" and no closing notes.
- Preserve every fact, number, name, date, citation and technical term EXACTLY.
- Do NOT invent new facts, quotes, statistics, or sources.
- Preserve the original paragraph breaks and overall structure unless tone is "shorten" or "expand".
- The output must be in the same language as the input.
- Make the result sound naturally written by a human — avoid robotic phrasing, repetitive structure, and obvious AI tells (e.g. "It is important to note that…", "In conclusion,", overuse of em-dashes, every sentence starting with the same connector).
- Vary sentence length and structure naturally.
- Do not use markdown formatting unless the input already uses it.`;
}

router.post("/ai/paraphrase", async (req, res) => {
  const { text, tone, strength } = req.body as {
    text?: string;
    tone?: ParaphraseTone;
    strength?: ParaphraseStrength;
  };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "Text is required" });
    return;
  }
  if (text.length > 12000) {
    res.status(400).json({ error: "Text is too long. Please keep it under 12,000 characters." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const safeTone: ParaphraseTone = tone && TONE_INSTRUCTIONS[tone] ? tone : "fluent";
  const safeStrength: ParaphraseStrength = strength && STRENGTH_INSTRUCTIONS[strength] ? strength : "medium";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4500,
      messages: [
        { role: "system", content: buildParaphrasePrompt(safeTone, safeStrength) },
        { role: "user", content: `Rewrite the following text:\n\n${text}` },
      ],
      stream: true,
    });

    req.on("close", () => { try { stream.controller.abort(); } catch { /* noop */ } });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err, "Paraphrase stream error");
    try {
      res.write(`data: ${JSON.stringify({ error: "Failed to paraphrase. Please try again." })}\n\n`);
      res.end();
    } catch { /* client disconnected */ }
  }
});

/* -------------------- AI CONTENT DETECTOR -------------------- */

/* ---- AI cliché phrase bank (known LLM tells) ---- */
const AI_CLICHES = [
  "delve into","delves into","delving into","in conclusion","to conclude","in summary","to summarize","to sum up",
  "it is important to note","it's important to note","it is worth noting","it's worth noting","it should be noted",
  "moreover","furthermore","additionally","in addition to this","on the other hand","that being said","with that said",
  "tapestry","vibrant tapestry","rich tapestry","navigate the landscape","navigate the complexities","navigating the",
  "in today's world","in today's fast-paced","in the modern era","in the contemporary world","in recent years",
  "play a crucial role","plays a crucial role","play a pivotal role","plays a pivotal role","play a significant role",
  "in the realm of","the realm of","at the heart of","at its core","cornerstone of",
  "a testament to","stands as a testament","stand as a testament","speaks volumes",
  "harness the power","harnessing the power","leverage the","leveraging the",
  "embark on a journey","embark on this journey","embarking on","unlock the potential","unlocking the",
  "shed light on","sheds light on","shedding light on","a deeper understanding","gain a deeper",
  "ever-evolving","ever-changing","ever-expanding","ever-growing","game-changer","game changing",
  "underscores the importance","underscores the need","emphasizes the importance","highlights the importance",
  "as we delve","let us delve","let's delve","as we explore","as we examine",
  "in essence","essentially","fundamentally","ultimately",
  "the importance of","the significance of","the role of","the impact of",
  "fosters","fostering","encompasses","encompassing","epitomizes","epitomized by",
  "intricate","intricacies","myriad","multifaceted","paramount","pivotal","robust","seamless","seamlessly",
  "navigate the","navigating the","crucial","essentially crucial",
  "not only","but also",
];

interface DetectorStats {
  totalWords: number;
  totalSentences: number;
  avgSentenceLength: number;
  sentenceLengthStdDev: number;
  burstiness: number;
  typeTokenRatio: number;
  aiClicheCount: number;
  aiClicheMatches: string[];
  emDashesPer100Words: number;
  semicolonCount: number;
  repeatedTrigrams: number;
  repeatedSentenceOpeners: number;
  paragraphCount: number;
}

function analyzeText(text: string): DetectorStats {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const wordsPerSentence = sentences.map((s) => (s.match(/\b[\w'-]+\b/g) || []).length);
  const totalWords = wordsPerSentence.reduce((a, b) => a + b, 0);
  const avgLen = totalWords / Math.max(1, sentences.length);
  const variance = wordsPerSentence.reduce((a, n) => a + (n - avgLen) ** 2, 0) / Math.max(1, sentences.length);
  const stdDev = Math.sqrt(variance);
  const burstiness = avgLen > 0 ? stdDev / avgLen : 0;

  const words = (text.toLowerCase().match(/\b[a-z'-]+\b/g) || []);
  const uniqueWords = new Set(words);
  const ttr = words.length > 0 ? uniqueWords.size / words.length : 0;

  const lowered = text.toLowerCase();
  const cliches: string[] = [];
  let clicheCount = 0;
  for (const c of AI_CLICHES) {
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['\u2019]");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const m = lowered.match(re);
    if (m && m.length > 0) {
      clicheCount += m.length;
      cliches.push(c);
    }
  }

  const emDashes = (text.match(/—/g) || []).length;
  const semicolons = (text.match(/;/g) || []).length;
  const emDashRate = totalWords > 0 ? (emDashes / totalWords) * 100 : 0;

  const trigramCounts: Record<string, number> = {};
  for (let i = 0; i < words.length - 2; i++) {
    const tg = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    trigramCounts[tg] = (trigramCounts[tg] || 0) + 1;
  }
  const repeatedTrigrams = Object.values(trigramCounts).filter((c) => c > 1).length;

  const openerCounts: Record<string, number> = {};
  for (const s of sentences) {
    const first = (s.split(/\s+/)[0] || "").toLowerCase().replace(/[^a-z']/g, "");
    if (first) openerCounts[first] = (openerCounts[first] || 0) + 1;
  }
  const repeatedSentenceOpeners = Object.values(openerCounts).filter((c) => c > 1).reduce((a, b) => a + b, 0);

  const paragraphCount = text.split(/\n{2,}/).filter((p) => p.trim().length > 0).length || 1;

  return {
    totalWords,
    totalSentences: sentences.length,
    avgSentenceLength: Number(avgLen.toFixed(1)),
    sentenceLengthStdDev: Number(stdDev.toFixed(1)),
    burstiness: Number(burstiness.toFixed(2)),
    typeTokenRatio: Number(ttr.toFixed(3)),
    aiClicheCount: clicheCount,
    aiClicheMatches: cliches.slice(0, 12),
    emDashesPer100Words: Number(emDashRate.toFixed(2)),
    semicolonCount: semicolons,
    repeatedTrigrams,
    repeatedSentenceOpeners,
    paragraphCount,
  };
}

/** Compute a 0-100 AI probability from purely statistical signals. */
function statsScoreFor(s: DetectorStats): number {
  let score = 45; // neutral baseline (slight lean human)

  // Burstiness: human ~0.55-0.9, AI ~0.20-0.45 (only meaningful with enough sentences)
  if (s.totalSentences >= 4) {
    if (s.burstiness < 0.25) score += 14;
    else if (s.burstiness < 0.4) score += 8;
    else if (s.burstiness > 0.75) score -= 12;
    else if (s.burstiness > 0.55) score -= 5;
  }

  // Type-token ratio is meaningful at scale
  if (s.totalWords >= 200) {
    if (s.typeTokenRatio < 0.35) score += 6;
    else if (s.typeTokenRatio > 0.55) score -= 4;
  }

  // AI clichés — strong tell
  const clicheRate = s.totalWords > 0 ? (s.aiClicheCount / s.totalWords) * 1000 : 0; // per 1000 words
  if (clicheRate >= 8) score += 25;
  else if (clicheRate >= 4) score += 15;
  else if (clicheRate >= 2) score += 8;
  else if (s.aiClicheCount > 0) score += 4;

  // Em-dash density (per 100 words). Heavy use is an AI tell.
  if (s.emDashesPer100Words > 2.0) score += 12;
  else if (s.emDashesPer100Words > 1.0) score += 6;
  else if (s.emDashesPer100Words > 0.5) score += 3;

  // Semicolons in casual / student text are a mild AI signal
  if (s.totalWords > 0) {
    const semiRate = (s.semicolonCount / s.totalWords) * 100;
    if (semiRate > 0.8) score += 5;
  }

  // Repeated openers (relative to total)
  if (s.totalSentences >= 5) {
    const ratio = s.repeatedSentenceOpeners / s.totalSentences;
    if (ratio > 0.5) score += 6;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function verdictForProb(p: number): string {
  if (p <= 25) return "Likely Human";
  if (p <= 45) return "Mostly Human";
  if (p <= 60) return "Mixed";
  if (p <= 80) return "Mostly AI";
  return "Likely AI";
}

router.post("/ai/detect", async (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string" || text.trim().length < 80) {
    res.status(400).json({ error: "Please provide at least 80 characters of text for accurate detection." });
    return;
  }
  if (text.length > 15000) {
    res.status(400).json({ error: "Text is too long. Please keep it under 15,000 characters." });
    return;
  }

  // 1) LOCAL STATISTICAL PRE-PASS
  const stats = analyzeText(text);
  const statsScore = statsScoreFor(stats);

  // 2) LLM ANALYSIS — given the same text AND our computed statistics as evidence
  const systemPrompt = `You are TREO TOOL'S AI Content Detector — a careful forensic linguist that estimates the probability a piece of text was generated by a large language model (ChatGPT, Gemini, Claude, Llama, DeepSeek, etc.).

You are explicitly told the following statistical evidence has already been computed from the input:
{{STATS_PLACEHOLDER}}

Interpret the statistics:
- "burstiness" = stddev / mean of sentence word counts. Human text typically 0.55-0.95; AI text typically 0.20-0.45 (smoother, more uniform sentences).
- "typeTokenRatio" = unique words / total words. Below 0.35 on a 200+ word text suggests AI vocabulary repetition.
- "aiClicheCount" counts known LLM filler phrases ("delve into", "in conclusion", "it is important to note", "vibrant tapestry", "navigate the landscape", "play a crucial role", "underscores", "ever-evolving", etc.). >4 per 1000 words is a strong AI tell.
- "emDashesPer100Words" >1.0 is a known ChatGPT signature.
- "repeatedSentenceOpeners" high relative to totalSentences = AI uniform structure.

Combine these signals with your own holistic reading of the text. Additionally judge:
- Perplexity (does the model find this text predictable?), unexpected/idiosyncratic word choices.
- Personal voice, lived experience, specific names/dates/places, opinions, humor, sarcasm.
- Hallucinated facts, generic filler, suspiciously perfect grammar.
- Domain register (technical / casual / academic / creative) — adjust expectations.
- For very short or technical text, lower your confidence.

Then return STRICT JSON only — no prose outside the JSON — with this schema:

{
  "modelProbability": <integer 0-100, YOUR independent confidence the text is AI-generated, ignoring the stats score itself but USING the underlying signals>,
  "confidence": "<one of: 'low', 'medium', 'high'>",
  "summary": "<2-4 sentence overall assessment in clear plain English explaining WHY>",
  "signals": [
    { "label": "<short signal name, e.g. 'Low burstiness'>", "weight": "<'human' or 'ai'>", "detail": "<one sentence explanation citing concrete observations>" }
  ],
  "sentenceAnalysis": [
    { "text": "<verbatim sentence from input, max 20 sentences, in order of appearance>", "aiScore": <integer 0-100> }
  ],
  "humanizeTips": [
    "<short actionable tip, e.g. 'Replace the third sentence with a personal example from your own experience.'>"
  ]
}

Calibration scale (for your own probability):
- 0-25 = Likely Human, 26-45 = Mostly Human, 46-60 = Mixed, 61-80 = Mostly AI, 81-100 = Likely AI.
- Confidence: 'low' for text <150 words or unusual styles, 'medium' default, 'high' only when multiple strong signals converge.
- Be honest about uncertainty. Many false positives happen with: non-native English writers, very formal academic prose, short text, translated text.
- Provide 4-7 signals, 3-5 humanize tips. Limit sentenceAnalysis to the 20 most informative sentences.`;

  const statsBlock = JSON.stringify(stats, null, 2);
  const finalSystem = systemPrompt.replace("{{STATS_PLACEHOLDER}}", statsBlock);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: finalSystem },
        { role: "user", content: `Analyse this text:\n\n"""\n${text}\n"""` },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(raw) as Record<string, unknown>; }
    catch {
      res.status(502).json({ error: "Detector returned malformed output. Please try again." });
      return;
    }

    // 3) SANITIZE LLM RESPONSE
    const CONFIDENCES = ["low", "medium", "high"] as const;
    const modelProbRaw = Number(parsed.modelProbability ?? parsed.aiProbability);
    const modelProbability = Number.isFinite(modelProbRaw) ? Math.max(0, Math.min(100, Math.round(modelProbRaw))) : 50;

    // 4) ENSEMBLE BLEND — model judgement (60%) + statistical signals (40%)
    let aiProbability = Math.round(modelProbability * 0.6 + statsScore * 0.4);
    aiProbability = Math.max(0, Math.min(100, aiProbability));

    // 5) CONFIDENCE — boost when model & stats agree, drop when they disagree or text is short
    let confidence: "low" | "medium" | "high" =
      typeof parsed.confidence === "string" && (CONFIDENCES as readonly string[]).includes(parsed.confidence)
        ? (parsed.confidence as "low" | "medium" | "high") : "medium";
    const agreement = Math.abs(modelProbability - statsScore);
    if (stats.totalWords < 150) confidence = "low";
    else if (agreement > 35) confidence = "low";
    else if (agreement < 12 && stats.totalWords >= 250) {
      confidence = confidence === "low" ? "medium" : "high";
    }

    const verdict = verdictForProb(aiProbability);
    const summary = typeof parsed.summary === "string" ? parsed.summary.slice(0, 1200) : "Analysis unavailable.";

    const signals = (Array.isArray(parsed.signals) ? parsed.signals : [])
      .map((s: unknown) => {
        if (!s || typeof s !== "object") return null;
        const o = s as Record<string, unknown>;
        const label = typeof o.label === "string" ? o.label.slice(0, 120) : "";
        const weight = o.weight === "ai" || o.weight === "human" ? o.weight : "ai";
        const detail = typeof o.detail === "string" ? o.detail.slice(0, 400) : "";
        return label ? { label, weight, detail } : null;
      })
      .filter((x): x is { label: string; weight: "ai" | "human"; detail: string } => x !== null)
      .slice(0, 8);

    const sentenceAnalysis = (Array.isArray(parsed.sentenceAnalysis) ? parsed.sentenceAnalysis : [])
      .map((s: unknown) => {
        if (!s || typeof s !== "object") return null;
        const o = s as Record<string, unknown>;
        const t = typeof o.text === "string" ? o.text.slice(0, 600) : "";
        const sc = Number(o.aiScore);
        const aiScore = Number.isFinite(sc) ? Math.max(0, Math.min(100, Math.round(sc))) : 50;
        return t ? { text: t, aiScore } : null;
      })
      .filter((x): x is { text: string; aiScore: number } => x !== null)
      .slice(0, 20);

    const humanizeTips = (Array.isArray(parsed.humanizeTips) ? parsed.humanizeTips : [])
      .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s: string) => s.slice(0, 300))
      .slice(0, 6);

    // Backward-compatible suspiciousSentences = top 3 sentences with score >=70
    const suspiciousSentences = sentenceAnalysis
      .filter((s) => s.aiScore >= 70)
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3)
      .map((s) => s.text);

    res.json({
      aiProbability,
      modelProbability,
      statsScore,
      verdict,
      confidence,
      summary,
      signals,
      sentenceAnalysis,
      suspiciousSentences,
      humanizeTips,
      stats,
    });
  } catch (err) {
    req.log.error(err, "AI detector error");
    res.status(500).json({ error: "Failed to analyse text. Please try again." });
  }
});

/* -------------------- YOUTUBE SUMMARIZER -------------------- */

type YtFormat = "concise" | "detailed" | "bullets" | "study";

const YT_FORMAT_INSTRUCTIONS: Record<YtFormat, string> = {
  concise: `Produce a tight TL;DR:
## TL;DR
A single 2–3 sentence overview.

## Top 5 takeaways
- Five concise bullets, each a complete idea.

## Watch this if…
- 2–3 short bullets describing who benefits most.`,
  detailed: `Produce thorough study-grade notes:
## Overview
2–4 sentences setting context.

## Detailed Notes
Use ## sub-headings for each major section in the video, with bullet points underneath. **Bold** key terms. Include any numbers, formulas, or examples mentioned.

## Key Quotes / Insights
- 3–5 noteworthy direct insights (paraphrased if not exact).

## Action Items
- 3–5 concrete things the viewer should do or try.

## Key Takeaway
One final summary sentence.`,
  bullets: `Produce a clean bullet-only digest:
## Key Points
- 8–15 bullet points capturing every important idea.
- One idea per bullet. **Bold** key terms. Keep each bullet under 25 words.

## Key Takeaway
One final summary sentence.`,
  study: `Produce a complete study pack:
## Summary
3–4 sentence overview.

## Detailed Notes
Use ## sub-headings, bullet points, **bold** key terms, and include examples/formulas.

## Key Terms
- **Term:** Definition (5–10 terms).

## Flashcards
Format each card EXACTLY as:
**Q1.** Question?
**A.** Answer.

Produce 8–12 flashcards.

## Quick Revision
- 5 one-line takeaways.`,
};

function buildYoutubePrompt(format: YtFormat, language: string, title?: string): string {
  return `You are TREO TOOL'S YouTube Summarizer — turning long videos into clear study material for students.

${title ? `Video title: "${title}"\n` : ""}Output language: ${language}. Respond entirely in this language (translate the transcript if needed).

Output style: ${format.toUpperCase()}
${YT_FORMAT_INSTRUCTIONS[format]}

Core rules:
- Base the summary STRICTLY on the transcript provided. Do not invent facts, statistics, names, or quotes that aren't supported by the transcript.
- If the transcript is auto-generated and noisy, interpret intelligently but don't fabricate details.
- Use markdown formatting: ## sub-headings, **bold key terms**, bullet points.
- Do NOT include filler like "In this video, the speaker says…" — get straight to the substance.
- Do NOT include timestamps unless they appear in the transcript.
- If the video is mostly entertainment / non-educational, still produce a useful structured summary in the requested format.`;
}

router.post("/ai/youtube-summarize", async (req, res) => {
  const { videoId, format, language } = req.body as {
    videoId?: string;
    format?: YtFormat;
    language?: string;
  };

  if (!videoId || typeof videoId !== "string" || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    res.status(400).json({ error: "Invalid YouTube video ID." });
    return;
  }

  const safeFormat: YtFormat = format && YT_FORMAT_INSTRUCTIONS[format] ? format : "detailed";
  const safeLanguage = (language && typeof language === "string" && language.trim().length > 0 ? language : "English").slice(0, 40);

  let transcriptText = "";
  let videoTitle: string | undefined;
  let source: "captions" | "description" = "captions";
  try {
    const result = await getYoutubeTranscriptRobust(videoId);
    transcriptText = result.transcript;
    videoTitle = result.title;
    source = result.source;
  } catch (err) {
    req.log.warn({ err, videoId }, "YouTube transcript fetch failed");
    res.status(422).json({ error: "Couldn't fetch captions or description for this video. It may be private, age-restricted, deleted, or region-blocked. Try a different video." });
    return;
  }

  const MAX_CHARS = 80000;
  if (transcriptText.length > MAX_CHARS) {
    transcriptText = transcriptText.slice(0, MAX_CHARS) + " …[truncated]";
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ meta: { title: videoTitle, videoId, source } })}\n\n`);

  const userIntro =
    source === "captions"
      ? `Transcript of the YouTube video${videoTitle ? ` "${videoTitle}"` : ""}:\n\n${transcriptText}`
      : `This YouTube video has no captions available. Summarize it based on the title, channel, and description below. At the very top, add this italic note exactly: *Note: This video has no captions. The summary is based on the video's title and description, which may not fully reflect the video's content.*\n\n${transcriptText}`;

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 6000,
      messages: [
        { role: "system", content: buildYoutubePrompt(safeFormat, safeLanguage, videoTitle) },
        { role: "user", content: userIntro },
      ],
      stream: true,
    });

    req.on("close", () => { try { stream.controller.abort(); } catch { /* noop */ } });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err, "YouTube summarize stream error");
    try {
      res.write(`data: ${JSON.stringify({ error: "Failed to summarize video. Please try again." })}\n\n`);
      res.end();
    } catch { /* client disconnected */ }
  }
});

export default router;
