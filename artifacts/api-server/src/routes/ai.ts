import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/ai/ask", async (req, res) => {
  const { question, history } = req.body as {
    question: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    res.status(400).json({ error: "Question is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = `You are a helpful, encouraging study assistant for students. 
Your job is to help students understand academic topics clearly and thoroughly.

Guidelines:
- Only answer questions related to academic study topics (science, math, history, literature, languages, geography, economics, technology, etc.)
- If asked something unrelated to studying, politely redirect to academic topics
- Give clear, structured explanations with examples where helpful
- Use simple language first, then add depth
- When explaining math or science, show step-by-step working
- Encourage curiosity and deeper thinking
- Format responses with headings, bullet points, and numbered steps where appropriate
- Keep answers concise but complete`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...(history || []).slice(-10),
    { role: "user", content: question.trim() },
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2048,
      messages,
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

export default router;
