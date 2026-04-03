import { randomUUID } from 'crypto';
import { pdfParserService } from './pdfParser.js';
import { embeddingService } from './embedding.js';
import { vectorStore } from './vectorStore.js';
import { addDocument } from './knowledgeBase.js';
import {
  insertSection,
  updateSectionEmbedding,
  getSectionsByDocumentId,
  deleteDocument,
} from '../db.js';

/**
 * Process a PDF upload: parse → chunk → embed → store in SQLite → index in vector store.
 * Returns the document ID and display name.
 */
export async function processUpload(
  pdfBuffer: Buffer,
  filename: string
): Promise<{ documentId: string; name: string }> {
  // 1. Parse PDF to extract text
  const text = await pdfParserService.parse(pdfBuffer);

  // 2. Chunk the extracted text
  const chunks = pdfParserService.chunk(text);

  // 3. Add document record to the DB
  const name = filename.replace(/\.pdf$/i, '');
  const documentId = addDocument(name, 'uploaded', filename);

  // 4. Insert each chunk as a section in the DB
  const sectionIds: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const sectionId = randomUUID();
    sectionIds.push(sectionId);
    insertSection(sectionId, documentId, `${name} — Chunk ${i + 1}`, chunks[i], i);
  }

  // 5. Embed all chunks in batch
  const embeddings = await embeddingService.embedBatch(chunks);

  // 6. Store embeddings in SQLite and add to vector store
  for (let i = 0; i < sectionIds.length; i++) {
    const buffer = Buffer.from(new Float32Array(embeddings[i]).buffer);
    updateSectionEmbedding(sectionIds[i], buffer);
  }

  vectorStore.addVectors(embeddings, sectionIds);

  return { documentId, name };
}

/**
 * Delete an uploaded document: remove vectors from the store, then delete from DB.
 * CASCADE on the documents table handles section cleanup.
 */
export function deleteUploadedDocument(documentId: string): void {
  // 1. Get all section IDs for this document
  const sections = getSectionsByDocumentId(documentId);
  const sectionIds = sections.map((s: any) => s.id);

  // 2. Remove vectors from the in-memory vector store
  if (sectionIds.length > 0) {
    vectorStore.removeVectors(sectionIds);
  }

  // 3. Delete the document from DB (CASCADE handles sections)
  deleteDocument(documentId);
}
