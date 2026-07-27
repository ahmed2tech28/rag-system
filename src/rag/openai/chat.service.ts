import { env } from "../../config/env.js";
import { getOpenAIClient } from "./client.js";

export interface ContextChunk {
  documentName: string;
  content: string;
}

export async function answerFromContext(
  question: string,
  contextChunks: ContextChunk[],
): Promise<string> {
  const client = getOpenAIClient();

  const context = contextChunks
    .map(
      (chunk, i) => `[${i + 1}] (from "${chunk.documentName}")\n${chunk.content}`,
    )
    .join("\n\n---\n\n");

  const response = await client.chat.completions.create({
    model: env.chatModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that answers questions using only the provided document excerpts. " +
          "Excerpts may come from multiple files. Synthesize an answer across all relevant excerpts. " +
          "If the answer isn't contained in the excerpts, say you don't know instead of guessing. " +
          "Cite sources inline using the excerpt numbers, e.g. [1].",
      },
      {
        role: "user",
        content: `Document excerpts:\n\n${context || "(no relevant excerpts found)"}\n\nQuestion: ${question}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
