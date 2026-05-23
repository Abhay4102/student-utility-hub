import { Router } from "express";
import { Buffer } from "node:buffer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, detectAudioFormat, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

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

  const systemPrompt = `You are TREO TOOL'S AI Content Detector — a careful forensic analyst that estimates the probability a piece of text was generated by a large language model (such as ChatGPT, Gemini, Claude, Llama or similar).

You are NOT a perfect detector and you must clearly say so. Use the following linguistic signals to form your estimate:

- Perplexity & burstiness: human writing has more variation in sentence length and unexpected word choices; AI writing tends to be smoother and more uniform.
- Vocabulary diversity and use of unusual or specific words.
- Repetitive sentence structures, overuse of transitional phrases ("Moreover", "Furthermore", "In conclusion", "It is important to note that", "Delve into", "Tapestry", "Navigate the landscape of").
- Overuse of em-dashes, semicolons, or perfectly balanced "not only X but also Y" constructions.
- Hedging clichés ("It is worth noting", "While it is true that").
- Lack of typos, personal voice, idioms, or genuine opinions.
- Topic drift, hallucinated facts, or generic filler that says little.
- For technical text: overly textbook-like phrasing, perfect organisation, but shallow examples.

Respond with STRICT JSON only — no prose outside the JSON. Schema:

{
  "aiProbability": <integer 0-100, your confidence the text is AI-generated>,
  "verdict": "<one of: 'Likely Human', 'Mostly Human', 'Mixed', 'Mostly AI', 'Likely AI'>",
  "confidence": "<one of: 'low', 'medium', 'high'>",
  "summary": "<2-3 sentence overall assessment in plain English>",
  "signals": [
    { "label": "<short signal name>", "weight": "<'human' or 'ai'>", "detail": "<one sentence explanation>" },
    ... 4 to 7 such signals
  ],
  "suspiciousSentences": [
    "<verbatim sentence from input that reads most AI-like>",
    ... up to 3 sentences (empty array if none)
  ],
  "humanizeTips": [
    "<short actionable tip to make this more human, e.g. 'Replace the third sentence with a specific personal example.'>",
    ... 3 to 5 tips
  ]
}

Calibration:
- 0-25 = Likely Human, 26-45 = Mostly Human, 46-60 = Mixed, 61-80 = Mostly AI, 81-100 = Likely AI.
- Confidence should be 'low' for texts under ~150 words or in unusual styles.
- Be honest: if the text is too short or ambiguous, say so in the summary and lower the confidence.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
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

    // Sanitize + enforce contract
    const VERDICTS = ["Likely Human", "Mostly Human", "Mixed", "Mostly AI", "Likely AI"] as const;
    const CONFIDENCES = ["low", "medium", "high"] as const;
    const probRaw = Number(parsed.aiProbability);
    const aiProbability = Number.isFinite(probRaw) ? Math.max(0, Math.min(100, Math.round(probRaw))) : 50;
    const fallbackVerdict =
      aiProbability <= 25 ? "Likely Human" :
      aiProbability <= 45 ? "Mostly Human" :
      aiProbability <= 60 ? "Mixed" :
      aiProbability <= 80 ? "Mostly AI" : "Likely AI";
    const verdict = typeof parsed.verdict === "string" && (VERDICTS as readonly string[]).includes(parsed.verdict)
      ? parsed.verdict : fallbackVerdict;
    const confidence = typeof parsed.confidence === "string" && (CONFIDENCES as readonly string[]).includes(parsed.confidence)
      ? parsed.confidence : "medium";
    const summary = typeof parsed.summary === "string" ? parsed.summary.slice(0, 1000) : "Analysis unavailable.";

    const signalsRaw = Array.isArray(parsed.signals) ? parsed.signals : [];
    const signals = signalsRaw
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

    const suspiciousSentences = (Array.isArray(parsed.suspiciousSentences) ? parsed.suspiciousSentences : [])
      .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s: string) => s.slice(0, 500))
      .slice(0, 3);

    const humanizeTips = (Array.isArray(parsed.humanizeTips) ? parsed.humanizeTips : [])
      .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s: string) => s.slice(0, 300))
      .slice(0, 5);

    res.json({ aiProbability, verdict, confidence, summary, signals, suspiciousSentences, humanizeTips });
  } catch (err) {
    req.log.error(err, "AI detector error");
    res.status(500).json({ error: "Failed to analyse text. Please try again." });
  }
});

export default router;
