import { pool } from "./pool.js";

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface DocumentRecord {
  id: string;
  original_name: string;
  stored_path: string;
  mime_type: string | null;
  size_bytes: number;
  status: DocumentStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export async function createDocument(input: {
  originalName: string;
  storedPath: string;
  mimeType: string | null;
  sizeBytes: number;
}): Promise<DocumentRecord> {
  const result = await pool.query<DocumentRecord>(
    `INSERT INTO documents (original_name, stored_path, mime_type, size_bytes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.originalName, input.storedPath, input.mimeType, input.sizeBytes],
  );

  return result.rows[0]!;
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  error?: string,
): Promise<void> {
  await pool.query(
    `UPDATE documents SET status = $2, error = $3, updated_at = now() WHERE id = $1`,
    [id, status, error ?? null],
  );
}

export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  const result = await pool.query<DocumentRecord>(`SELECT * FROM documents WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const result = await pool.query<DocumentRecord>(
    `SELECT * FROM documents ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function getDocumentsByIds(ids: string[]): Promise<DocumentRecord[]> {
  if (ids.length === 0) return [];
  const result = await pool.query<DocumentRecord>(`SELECT * FROM documents WHERE id = ANY($1)`, [
    ids,
  ]);
  return result.rows;
}

export async function deleteDocument(id: string): Promise<void> {
  await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
}
