/**
 * In-memory vector store using cosine similarity for nearest-neighbor search.
 * Stores vectors in a Map and computes similarity on the fly — no native
 * dependencies required.
 */

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

export class VectorStore {
  private vectors: Map<string, number[]> = new Map();

  /**
   * Populate the store from an array of pre-computed embeddings.
   * Typically called on server startup with vectors loaded from SQLite.
   */
  initialize(chunks: { id: string; vector: number[] }[]): void {
    this.vectors.clear();
    for (const chunk of chunks) {
      this.vectors.set(chunk.id, chunk.vector);
    }
  }

  /**
   * Add new vectors to the store. `vectors` and `ids` must be the same length.
   */
  addVectors(vectors: number[][], ids: string[]): void {
    for (let i = 0; i < ids.length; i++) {
      this.vectors.set(ids[i], vectors[i]);
    }
  }

  /**
   * Remove vectors by their IDs.
   */
  removeVectors(ids: string[]): void {
    for (const id of ids) {
      this.vectors.delete(id);
    }
  }

  /**
   * Find the top-K most similar vectors to `queryVector`, ranked by
   * descending cosine similarity. All returned scores are non-negative.
   */
  search(
    queryVector: number[],
    topK: number
  ): { id: string; score: number }[] {
    const results: { id: string; score: number }[] = [];

    for (const [id, vector] of this.vectors) {
      const score = Math.max(0, cosineSimilarity(queryVector, vector));
      results.push({ id, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /** Current number of stored vectors. */
  get size(): number {
    return this.vectors.size;
  }
}

// Singleton instance used across the application
export const vectorStore = new VectorStore();
