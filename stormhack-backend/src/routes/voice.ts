import { Request, Response, Router } from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for temporary file storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tmpDir = "/tmp";
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".webm";
      cb(null, `audio-${Date.now()}${ext}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB (OpenAI limit)
  },
  fileFilter: (req, file, cb) => {
    // Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/mpeg",
      "audio/mpga",
      "audio/m4a",
      "audio/wav",
      "audio/webm",
      "video/webm", // webm can be video/webm from browser
    ];

    if (
      allowedMimes.includes(file.mimetype) ||
      file.originalname.match(/\.(mp3|mp4|mpeg|mpga|m4a|wav|webm)$/i)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm"
        )
      );
    }
  },
});

// POST /api/voice/transcribe
router.post(
  "/transcribe",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    let filePath: string | undefined;

    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Bad request",
          message: "Audio file is required (field name: 'audio')",
        });
      }

      filePath = req.file.path;

      // Create ReadStream for OpenAI
      const audioFile = fs.createReadStream(filePath);

      // Call OpenAI Transcription API
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "gpt-4o-mini-transcribe", // or "gpt-4o-transcribe" for higher quality
        language: "en", // English only
        response_format: "text", // Simple text response
        prompt:
          "The transcript may contain food ingredients or medical conditions like diabetes, hypertension.", // Optional: help model recognize domain-specific terms
      });

      // Clean up temp file
      fs.unlinkSync(filePath);

      // Return transcription
      res.json({
        text: transcription.toLowerCase().trim(), // Normalized for easier parsing
        originalText: transcription,
      });
    } catch (error) {
      // Clean up temp file on error
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error("Failed to cleanup temp file:", cleanupError);
        }
      }

      console.error("Transcription error:", error);

      if (error instanceof OpenAI.APIError) {
        return res.status(error.status || 500).json({
          error: "OpenAI API error",
          message: error.message,
          code: error.code,
        });
      }

      res.status(500).json({
        error: "Transcription failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
