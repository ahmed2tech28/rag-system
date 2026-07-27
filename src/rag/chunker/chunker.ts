export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 150;

/**
 * Splits text into overlapping chunks, breaking on paragraph/sentence/word
 * boundaries where possible instead of mid-word.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= chunkSize) return [normalized];

  const separators = ["\n\n", "\n", ". ", " "];

  function findSplitPoint(slice: string): number {
    for (const separator of separators) {
      const index = slice.lastIndexOf(separator, chunkSize);
      if (index > chunkSize * 0.5) {
        return index + separator.length;
      }
    }
    return chunkSize;
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const slice = normalized.slice(start);
    if (slice.length <= chunkSize) {
      chunks.push(slice.trim());
      break;
    }

    const splitPoint = findSplitPoint(slice);
    const chunk = slice.slice(0, splitPoint).trim();
    if (chunk) chunks.push(chunk);

    start += Math.max(splitPoint - chunkOverlap, 1);
  }

  return chunks.filter((chunk) => chunk.length > 0);
}
