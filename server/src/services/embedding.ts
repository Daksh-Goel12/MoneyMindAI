import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-embedding-001';
const BATCH_CHUNK_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EmbeddingService {
  private model;

  constructor(apiKey: string, model?: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: model ?? DEFAULT_MODEL });
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.model.embedContent(text);
    return result.embedding.values;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_CHUNK_SIZE) {
      if (i > 0) {
        await delay(RATE_LIMIT_DELAY_MS);
      }

      const chunk = texts.slice(i, i + BATCH_CHUNK_SIZE);
      const requests = chunk.map((text) => ({
        content: { role: 'document' as const, parts: [{ text }] },
      }));

      const response = await this.model.batchEmbedContents({ requests });
      results.push(...response.embeddings.map((e) => e.values));
    }

    return results;
  }
}

const apiKey = process.env.GEMINI_API_KEY ?? '';
export const embeddingService = new EmbeddingService(apiKey);
