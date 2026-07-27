import { randomUUID } from "node:crypto";
import path from "node:path";

import multer, { type FileFilterCallback } from "multer";
import type { Request, RequestHandler } from "express";

import { env } from "../config/env.js";

const SUPPORTED_EXTENSIONS = new Set([".pdf", ".txt", ".md", ".markdown", ".html", ".htm", ".docx"]);

const storage = multer.diskStorage({
  destination: env.uploadDir,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    callback(new Error(`Unsupported file type: ${extension || "unknown"}`));
    return;
  }
  callback(null, true);
}

export const uploadDocuments: RequestHandler = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
    files: env.maxFiles,
  },
}).array("files", env.maxFiles);
