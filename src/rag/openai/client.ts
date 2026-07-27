import OpenAI from "openai";

import { env } from "../../config/env.js";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey(), baseURL: env.openaiBaseUrl });
  }
  return client;
}
