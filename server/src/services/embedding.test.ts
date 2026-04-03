import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddingService } from './embedding.js';

// Mock the @google/generative-ai SDK
vi.mock('@google/generative-ai', () => {
  const mockEmbedContent = vi.fn();
  const mockBatchEmbedContents = vi.fn();
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        embedContent: mockEmbedContent,
        batchEmbedContents: mockBatchEmbedContents,
      }),
    })),
    __mockEmbedContent: mockEmbedContent,
    __mockBatchEmbedContents: mockBatchEmbedContents,
  };
});

// Access the mocks
async function getMocks() {
  const mod = await import('@google/generative-ai');
  return {
    mockEmbedContent: (mod as any).__mockEmbedContent as ReturnType<typeof vi.fn>,
    mockBatchEmbedContents: (mod as any).__mockBatchEmbedContents as ReturnType<typeof vi.fn>,
  };
}

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmbeddingService('test-api-key');
  });

  describe('embed', () => {
    it('returns embedding values for a single text', async () => {
      const { mockEmbedContent } = await getMocks();
      mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: [0.1, 0.2, 0.3] },
      });

      const result = await service.embed('hello world');
      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockEmbedContent).toHaveBeenCalledWith('hello world');
    });
  });

  describe('embedBatch', () => {
    it('returns empty array for empty input', async () => {
      const result = await service.embedBatch([]);
      expect(result).toEqual([]);
    });

    it('returns embeddings for multiple texts', async () => {
      const { mockBatchEmbedContents } = await getMocks();
      mockBatchEmbedContents.mockResolvedValueOnce({
        embeddings: [
          { values: [0.1, 0.2] },
          { values: [0.3, 0.4] },
        ],
      });

      const result = await service.embedBatch(['text1', 'text2']);
      expect(result).toEqual([[0.1, 0.2], [0.3, 0.4]]);
      expect(mockBatchEmbedContents).toHaveBeenCalledWith({
        requests: [
          { content: { role: 'document', parts: [{ text: 'text1' }] } },
          { content: { role: 'document', parts: [{ text: 'text2' }] } },
        ],
      });
    });
  });
});
