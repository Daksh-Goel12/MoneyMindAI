import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService } from './llm.js';

// Mock the @google/generative-ai SDK
vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn();
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
    __mockGenerateContent: mockGenerateContent,
  };
});

async function getMocks() {
  const mod = await import('@google/generative-ai');
  return {
    mockGenerateContent: (mod as any).__mockGenerateContent as ReturnType<typeof vi.fn>,
  };
}

describe('LLMService', () => {
  let service: LLMService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LLMService('test-api-key');
  });

  describe('generateResponse', () => {
    it('builds prompt with context and returns generated text', async () => {
      const { mockGenerateContent } = await getMocks();
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'A budget helps you track spending.' },
      });

      const result = await service.generateResponse('What is a budget?', [
        'A budget is a plan for your money.',
        'Budgeting helps control expenses.',
      ]);

      expect(result).toBe('A budget helps you track spending.');
      expect(mockGenerateContent).toHaveBeenCalledOnce();

      const calledPrompt = mockGenerateContent.mock.calls[0][0] as string;
      expect(calledPrompt).toContain('A budget is a plan for your money.');
      expect(calledPrompt).toContain('Budgeting helps control expenses.');
      expect(calledPrompt).toContain('What is a budget?');
      expect(calledPrompt).toContain('--- Retrieved Context ---');
      expect(calledPrompt).toContain('--- End Context ---');
    });

    it('handles empty context array gracefully', async () => {
      const { mockGenerateContent } = await getMocks();
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'I don\'t have relevant context for that.' },
      });

      const result = await service.generateResponse('Tell me about stocks', []);

      expect(result).toBe('I don\'t have relevant context for that.');
      const calledPrompt = mockGenerateContent.mock.calls[0][0] as string;
      expect(calledPrompt).toContain('No relevant context found.');
      expect(calledPrompt).toContain('Tell me about stocks');
    });

    it('uses custom model when provided', () => {
      const customService = new LLMService('test-key', 'gemini-2.0-flash');
      expect(customService).toBeInstanceOf(LLMService);
    });
  });
});
