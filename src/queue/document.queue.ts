import { Queue } from "bullmq";

import { redisConnection } from "./connection.js";

export const DOCUMENT_QUEUE_NAME = "document-processing";

export interface DocumentJobData {
  documentId: string;
  filePath: string;
}

export const documentQueue = new Queue<DocumentJobData>(DOCUMENT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

export async function enqueueDocumentJob(data: DocumentJobData): Promise<void> {
  await documentQueue.add("process-document", data);
}
