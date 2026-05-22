import { Router } from "express";
import { Buffer } from "node:buffer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText, detectAudioFormat, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

const router = Router();

const STUDY_SYSTEM_PROMPT = `You are a helpful, encouraging study assistant for students.

Guidelines:
- Only answer academic study questions (science, math, history, literature, languages, geography, economics, technology, etc.)
- If asked something off-topic, politely redirect to academic topics
- Give clear, structured explanations with worked examples
- Format with markdown: ## headings, **bold**, bullet points, numbered steps
- For math: write equations in plain text using symbols like ×, ÷, ², ³, √, π, ∫, Σ. NEVER use code blocks (no triple backticks, no \`\`\`) for math or formulas. Just write equations on their own line, e.g. "x = (-b ± √(b² - 4ac)) / 2a"
- For step-by-step solutions, number each step clearly with a brief explanation
- Use code blocks ONLY for actual programming code (Python, JS, C++, etc.)
- Keep answers focused and complete; avoid filler`;

const NOTES_SYSTEM_PROMPT = `You are an expert study notes creator. Generate clear, well-organized study notes for the given topic.

Format STRICTLY as markdown:
- Start with a "# {Topic}" title
- Use "## Section Headings" for main sections (Introduction, Key Concepts, Important Formulas, Examples, Summary)
- Use bullet points (-) for lists of facts/points
- Use **bold** for key terms and important phrases
- Number any step-by-step processes
- Include a "## Quick Revision" section at the end with 5-8 one-line key takeaways
- For math/science: write equations in plain text with symbols (×, ÷, ², √, π). Never use code blocks for math.
- Aim for comprehensive but scannable notes — a student should be able to revise from this in 5 minutes`;

router.post("/ai/ask", async (req, res) => {
  const { question, history, imageBase64, imageMimeType } = req.body as {
    question: string;
    history?: { role: "user" | "assistant"; content: string }[];
    imageBase64?: string;
    imageMimeType?: string;
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

  const messages = [
    { role: "system" as const, content: STUDY_SYSTEM_PROMPT },
    ...((history || []).slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }))),
    { role: "user" as const, content: userContent },
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2048,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      stream: true,
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
    res.write(`data: ${JSON.stringify({ error: "Failed to get answer. Please try again." })}\n\n`);
    res.end();
  }
});

router.post("/ai/transcribe", async (req, res) => {
  const { audioBase64, format } = req.body as {
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
      // mp4/ogg/unknown — convert to wav via ffmpeg
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
  const { topic, sourceText } = req.body as {
    topic?: string;
    sourceText?: string;
  };

  if ((!topic || topic.trim().length === 0) && (!sourceText || sourceText.trim().length === 0)) {
    res.status(400).json({ error: "Topic or source text is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const userPrompt = sourceText
    ? `Create comprehensive study notes from this source material${topic ? ` on the topic "${topic}"` : ""}:\n\n${sourceText.slice(0, 12000)}`
    : `Create comprehensive study notes on: ${topic}`;

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 3000,
      messages: [
        { role: "system", content: NOTES_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: true,
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
    res.write(`data: ${JSON.stringify({ error: "Failed to generate notes" })}\n\n`);
    res.end();
  }
});

export default router;
