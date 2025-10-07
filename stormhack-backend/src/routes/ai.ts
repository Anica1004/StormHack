import express from "express";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// Rate limiter: 每 15 分钟最多 100 次请求
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests",
    message: "Please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// POST /api/ai/chat
router.post("/chat", chatLimiter, async (req, res) => {
  try {
    const {
      messages,
      model = "gpt-4",
      temperature = 0.7,
      max_tokens,
    } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Bad request",
        message: "messages array is required",
      });
    }

    const validRoles = ["system", "user", "assistant"];
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          error: "Bad request",
          message: "Each message must have role and content",
        });
      }
      if (!validRoles.includes(msg.role)) {
        return res.status(400).json({
          error: "Bad request",
          message: `Invalid role: ${msg.role}`,
        });
      }
    }

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      ...(max_tokens && { max_tokens }),
    });

    res.json({
      message: completion.choices[0].message.content,
      usage: completion.usage,
      model: completion.model,
    });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    if (error.code === "insufficient_quota") {
      return res.status(402).json({
        error: "Quota exceeded",
        message: "OpenAI API quota has been exceeded",
      });
    }

    res.status(500).json({
      error: "AI request failed",
      message: error.message,
    });
  }
});
export default router;
