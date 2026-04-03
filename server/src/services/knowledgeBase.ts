import { randomUUID } from 'crypto';
import {
  getAllDocuments,
  getSectionsByDocumentId,
  getSectionById,
  searchSections as dbSearchSections,
  insertDocument,
  deleteDocument,
} from '../db.js';
import type { Document, Section } from '../types.js';

function mapSection(row: any): Section {
  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    content: row.content,
    chunkIndex: row.chunk_index,
  };
}

export function getAllDocumentsWithSections(): Document[] {
  const docs = getAllDocuments();
  return docs.map((doc) => {
    const sectionRows = getSectionsByDocumentId(doc.id);
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type as 'curated' | 'uploaded',
      filename: doc.filename ?? undefined,
      sections: sectionRows.map(mapSection),
      createdAt: doc.created_at,
    };
  });
}

export function getSection(sectionId: string): Section | undefined {
  const row = getSectionById(sectionId);
  if (!row) return undefined;
  return mapSection(row);
}

export function searchSections(query: string): Section[] {
  const rows = dbSearchSections(query);
  return rows.map(mapSection);
}

export function addDocument(
  name: string,
  type: 'curated' | 'uploaded',
  filename?: string
): string {
  const id = randomUUID();
  insertDocument(id, name, type, filename);
  return id;
}

export function removeDocument(docId: string): void {
  deleteDocument(docId);
}
