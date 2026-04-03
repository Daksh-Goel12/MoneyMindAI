import { describe, it, expect } from 'vitest';
import { PDFParserService } from './pdfParser.js';

describe('PDFParserService', () => {
  const service = new PDFParserService();

  describe('chunk', () => {
    it('returns empty array for empty string', () => {
      expect(service.chunk('')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
      expect(service.chunk('   \n\t  ')).toEqual([]);
    });

    it('returns single chunk when text is shorter than chunkSize', () => {
      const text = 'one two three four five';
      const chunks = service.chunk(text, 10, 2);
      expect(chunks).toEqual(['one two three four five']);
    });

    it('splits text into overlapping chunks', () => {
      // 10 words, chunkSize=4, overlap=2 → chunks start at 0, 2, 4, 6, 8
      const words = Array.from({ length: 10 }, (_, i) => `w${i}`);
      const text = words.join(' ');
      const chunks = service.chunk(text, 4, 2);

      expect(chunks[0]).toBe('w0 w1 w2 w3');
      expect(chunks[1]).toBe('w2 w3 w4 w5');
      expect(chunks[2]).toBe('w4 w5 w6 w7');
      expect(chunks[3]).toBe('w6 w7 w8 w9');
    });

    it('uses default chunkSize=500 and overlap=50', () => {
      const words = Array.from({ length: 600 }, (_, i) => `word${i}`);
      const text = words.join(' ');
      const chunks = service.chunk(text);

      // First chunk: 500 words, second chunk starts at 450
      expect(chunks[0]!.split(' ').length).toBe(500);
      expect(chunks[1]!.split(' ')[0]).toBe('word450');
    });

    it('handles exact chunkSize boundary', () => {
      const words = Array.from({ length: 10 }, (_, i) => `w${i}`);
      const text = words.join(' ');
      const chunks = service.chunk(text, 10, 3);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('handles overlap of 0', () => {
      const words = Array.from({ length: 8 }, (_, i) => `w${i}`);
      const text = words.join(' ');
      const chunks = service.chunk(text, 4, 0);

      expect(chunks).toEqual(['w0 w1 w2 w3', 'w4 w5 w6 w7']);
    });
  });
});
