import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),

  databaseUrl: process.env.DATABASE_URL ?? "postgresql://localhost:5432/rag_system",
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",

  openaiApiKey: () => required("OPENAI_API_KEY"),
  openaiBaseUrl:
    process.env.OPENAI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai/",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "gemini-embedding-001",
  embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? 768),
  chatModel: process.env.CHAT_MODEL ?? "gemini-2.5-flash",

  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB ?? 20),
  maxFiles: Number(process.env.MAX_FILES ?? 5),

  topK: Number(process.env.RETRIEVAL_TOP_K ?? 8),
};
