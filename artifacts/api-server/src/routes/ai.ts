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

export default router;
