import { mkdir } from "node:fs/promises";

import compression from "compression";
import cors from "cors";
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { initDatabase } from "./db/init.js";
import { startDocumentWorker } from "./queue/document.worker.js";
import { askRouter } from "./routes/ask.route.js";
import { documentsRouter } from "./routes/documents.route.js";

async function main() {
  await mkdir(env.uploadDir, { recursive: true });
  await initDatabase();

  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), "public")));


  app.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/documents", documentsRouter);
  app.use("/api/ask", askRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  });

  startDocumentWorker();

  app.listen(env.port, () => {
    console.log(`http://localhost:${env.port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
