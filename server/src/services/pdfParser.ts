import pdfParse from 'pdf-parse';

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 50;

export class PDFParserService {
  /**
   * Extract text content from a PDF buffer.
   */
  async parse(buffer: Buffer): Promise<string> {
    const result = await pdfParse(buffer);
    return result.text;
  }

  /**
   * Split text into overlapping chunks using word count as a proxy for tokens.
   * Default chunkSize=500 words, overlap=50 words.
   */
  chunk(
    text: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    overlap: number = DEFAULT_OVERLAP,
  ): string[] {
    const words = text.split(/\s+/).filter((w) => w.length > 0);

    if (words.length === 0) return [];

    const chunks: string[] = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      chunks.push(words.slice(start, end).join(' '));

      if (end >= words.length) break;

      start += chunkSize - overlap;
    }

    return chunks;
  }
}

export const pdfParserService = new PDFParserService();
