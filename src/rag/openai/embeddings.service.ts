import { env } from "../../config/env.js";
import { getOpenAIClient } from "./client.js";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getOpenAIClient();
  const embeddings: number[][] = [];

  // Gemini's OpenAI-compatible embeddings endpoint doesn't reliably support
  // batched array input, so embed one text at a time.
  for (const text of texts) {
    const response = await client.embeddings.create({
      model: env.embeddingModel,
      input: text,
      dimensions: env.embeddingDimensions,
    });
    embeddings.push(response.data[0]!.embedding);
  }

  return embeddings;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding!;
}
