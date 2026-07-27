import { unlink } from "node:fs/promises";

import { Worker, type Job } from "bullmq";

import { insertChunks } from "../db/chunks.repository.js";
import { updateDocumentStatus } from "../db/documents.repository.js";
import { chunkText } from "../rag/chunker/chunker.js";
import { embedTexts } from "../rag/openai/embeddings.service.js";
import { ParserFactory } from "../rag/parser/parser.factory.js";

import { redisConnection } from "./connection.js";
import { DOCUMENT_QUEUE_NAME, type DocumentJobData } from "./document.queue.js";

async function processDocumentJob(job: Job<DocumentJobData>): Promise<void> {
  const { documentId, filePath } = job.data;

  await updateDocumentStatus(documentId, "processing");

  try {
    const parser = ParserFactory.create(filePath);
    const parsed = await parser.parse(filePath);

    const chunks = chunkText(parsed.text);
    if (chunks.length === 0) {
      throw new Error("Document produced no extractable text");
    }

    const embeddings = await embedTexts(chunks);

    await insertChunks(
      documentId,
      chunks.map((content, index) => ({
        content,
        embedding: embeddings[index]!,
        chunkIndex: index,
      })),
    );

    await updateDocumentStatus(documentId, "completed");
    await unlink(filePath).catch(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing error";
    await updateDocumentStatus(documentId, "failed", message);
    // Keep the file on disk on failure (even after the final retry) so the
    // /retry endpoint can re-run processing without re-uploading.
    throw error;
  }
}

export function startDocumentWorker(): Worker<DocumentJobData> {
  const worker = new Worker<DocumentJobData>(DOCUMENT_QUEUE_NAME, processDocumentJob, {
    connection: redisConnection,
    concurrency: 2,
  });

  worker.on("failed", (job, error) => {
    console.error(`Document job ${job?.id} failed:`, error.message);
  });

  return worker;
}
