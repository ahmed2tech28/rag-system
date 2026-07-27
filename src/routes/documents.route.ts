import { Router, type Request, type Response, type NextFunction } from "express";

import {
  createDocument,
  getDocumentById,
  listDocuments,
  updateDocumentStatus,
} from "../db/documents.repository.js";
import { enqueueDocumentJob } from "../queue/document.queue.js";
import { uploadDocuments } from "../upload/multer.config.js";

export const documentsRouter: Router = Router();

documentsRouter.post(
  "/upload",
  (req: Request, res: Response, next: NextFunction) => {
    uploadDocuments(req, res, (error: unknown) => {
      if (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        res.status(400).json({ error: message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    if (files.length === 0) {
      res.status(400).json({ error: "No files uploaded. Use the 'files' field." });
      return;
    }

    const documents = await Promise.all(
      files.map(async (file) => {
        const document = await createDocument({
          originalName: file.originalname,
          storedPath: file.path,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        });

        await enqueueDocumentJob({ documentId: document.id, filePath: file.path });

        return {
          id: document.id,
          originalName: document.original_name,
          sizeBytes: document.size_bytes,
          status: document.status,
        };
      }),
    );

    res.status(202).json({ documents });
  },
);

documentsRouter.get("/", async (_req: Request, res: Response) => {
  const documents = await listDocuments();
  res.json({
    documents: documents.map((doc) => ({
      id: doc.id,
      originalName: doc.original_name,
      sizeBytes: doc.size_bytes,
      status: doc.status,
      error: doc.error,
      createdAt: doc.created_at,
    })),
  });
});

documentsRouter.post("/:id/retry", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const document = await getDocumentById(id);

  if (!document) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  if (document.status !== "failed") {
    res.status(400).json({
      error: `Only failed documents can be retried (current status: ${document.status})`,
    });
    return;
  }

  await updateDocumentStatus(id, "pending");
  await enqueueDocumentJob({ documentId: id, filePath: document.stored_path });

  res.status(202).json({ id, status: "pending" });
});

documentsRouter.get("/:id", async (req: Request, res: Response) => {
  const document = await getDocumentById(req.params.id as string);
  if (!document) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json({
    id: document.id,
    originalName: document.original_name,
    sizeBytes: document.size_bytes,
    status: document.status,
    error: document.error,
    createdAt: document.created_at,
  });
});
