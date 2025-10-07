import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import ingredientRoutes from "./routes/ingredientRoutes";
import diseaseRoutes from "./routes/diseaseRoutes";
import voiceRouter from "./routes/voice";
import aiRoutes from "./routes/ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "StormHack Backend is running!",
    timestamp: new Date().toISOString(),
  });
});

// Test database connection
app.get("/api/db-test", async (req: Request, res: Response) => {
  try {
    await prisma.$connect();
    res.json({
      status: "ok",
      message: "Database connected successfully!",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API Routes
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/diseases", diseaseRoutes);
app.use("/api/voice", voiceRouter);
app.use("/api/ai", aiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: Connected to Supabase`);
  console.log(`📝 API Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/db-test`);
  console.log(`   GET  /api/ingredients/search?q=<query>`);
  console.log(
    `   GET  /api/ingredients/:name/compatibility?filter=<all|avoid|beneficial>`
  );
  console.log(`   POST /api/diseases/guide`);
  console.log(`   GET  /api/diseases`);
});
