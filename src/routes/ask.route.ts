import { Router, type Request, type Response } from "express";

import { env } from "../config/env.js";
import { searchSimilarChunks } from "../db/chunks.repository.js";
import { getDocumentsByIds } from "../db/documents.repository.js";
import { answerFromContext } from "../rag/openai/chat.service.js";
import { embedQuery } from "../rag/openai/embeddings.service.js";

export const askRouter: Router = Router();

askRouter.post("/", async (req: Request, res: Response) => {
  const { question, documentIds } = req.body as {
    question?: string;
    documentIds?: string[];
  };

  if (!question || typeof question !== "string" || !question.trim()) {
    res.status(400).json({ error: "'question' is required" });
    return;
  }

  const queryEmbedding = await embedQuery(question);
  const matches = await searchSimilarChunks(
    queryEmbedding,
    env.topK,
    Array.isArray(documentIds) && documentIds.length > 0 ? documentIds : undefined,
  );

  if (matches.length === 0) {
    res.json({
      answer:
        "I don't have any processed documents to answer from yet. Upload files and wait for them to finish processing.",
      sources: [],
    });
    return;
  }

  const documents = await getDocumentsByIds([...new Set(matches.map((m) => m.document_id))]);
  const documentNameById = new Map(documents.map((doc) => [doc.id, doc.original_name]));

  const answer = await answerFromContext(
    question,
    matches.map((match) => ({
      documentName: documentNameById.get(match.document_id) ?? "unknown",
      content: match.content,
    })),
  );

  res.json({
    answer,
    sources: matches.map((match) => ({
      documentId: match.document_id,
      documentName: documentNameById.get(match.document_id) ?? "unknown",
      chunkIndex: match.chunk_index,
      distance: match.distance,
    })),
  });
});
