import pgvector from "pgvector";

import { pool } from "./pool.js";

export interface ChunkInput {
  content: string;
  embedding: number[];
  chunkIndex: number;
}

export interface ChunkSearchResult {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  distance: number;
}

export async function insertChunks(documentId: string, chunks: ChunkInput[]): Promise<void> {
  if (chunks.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const chunk of chunks) {
      await client.query(
        `INSERT INTO chunks (document_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [documentId, chunk.chunkIndex, chunk.content, pgvector.toSql(chunk.embedding)],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function searchSimilarChunks(
  queryEmbedding: number[],
  topK: number,
  documentIds?: string[],
): Promise<ChunkSearchResult[]> {
  const embeddingSql = pgvector.toSql(queryEmbedding);

  if (documentIds && documentIds.length > 0) {
    const result = await pool.query<ChunkSearchResult>(
      `SELECT id, document_id, content, chunk_index, embedding <=> $1::vector AS distance
       FROM chunks
       WHERE document_id = ANY($2)
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [embeddingSql, documentIds, topK],
    );
    return result.rows;
  }

  const result = await pool.query<ChunkSearchResult>(
    `SELECT id, document_id, content, chunk_index, embedding <=> $1::vector AS distance
     FROM chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [embeddingSql, topK],
  );
  return result.rows;
}
