import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'moneymind.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Enable foreign key enforcement
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('curated', 'uploaded')),
    filename TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding BLOB,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
    rating TEXT NOT NULL CHECK(rating IN ('up', 'down')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- Helper functions for common queries ---

// Documents
export function insertDocument(id: string, name: string, type: 'curated' | 'uploaded', filename?: string): void {
  const stmt = db.prepare('INSERT INTO documents (id, name, type, filename) VALUES (?, ?, ?, ?)');
  stmt.run(id, name, type, filename ?? null);
}

export function getAllDocuments(): { id: string; name: string; type: string; filename: string | null; created_at: string }[] {
  return db.prepare('SELECT * FROM documents ORDER BY created_at ASC').all() as any[];
}

export function getDocumentById(id: string) {
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any | undefined;
}

export function deleteDocument(id: string): void {
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

export function countDocumentsByType(type: 'curated' | 'uploaded'): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM documents WHERE type = ?').get(type) as any;
  return row.count;
}

// Sections
export function insertSection(
  id: string,
  documentId: string,
  title: string,
  content: string,
  chunkIndex: number,
  embedding?: Buffer | null
): void {
  const stmt = db.prepare(
    'INSERT INTO sections (id, document_id, title, content, chunk_index, embedding) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, documentId, title, content, chunkIndex, embedding ?? null);
}

export function getSectionsByDocumentId(documentId: string) {
  return db.prepare('SELECT * FROM sections WHERE document_id = ? ORDER BY chunk_index ASC').all(documentId) as any[];
}

export function getSectionById(id: string) {
  return db.prepare('SELECT * FROM sections WHERE id = ?').get(id) as any | undefined;
}

export function getAllSections() {
  return db.prepare('SELECT * FROM sections ORDER BY chunk_index ASC').all() as any[];
}

export function searchSections(query: string) {
  const pattern = `%${query}%`;
  return db.prepare(
    'SELECT * FROM sections WHERE title LIKE ? OR content LIKE ? ORDER BY chunk_index ASC'
  ).all(pattern, pattern) as any[];
}

export function updateSectionEmbedding(id: string, embedding: Buffer): void {
  db.prepare('UPDATE sections SET embedding = ? WHERE id = ?').run(embedding, id);
}

// Sessions
export function insertSession(id: string, title?: string): void {
  const stmt = db.prepare('INSERT INTO sessions (id, title) VALUES (?, ?)');
  stmt.run(id, title ?? null);
}

export function getAllSessions() {
  return db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all() as any[];
}

export function getSessionById(id: string) {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any | undefined;
}

export function updateSessionTimestamp(id: string): void {
  db.prepare("UPDATE sessions SET updated_at = datetime('now') WHERE id = ?").run(id);
}

export function updateSessionTitle(id: string, title: string): void {
  db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(title, id);
}

// Messages
export function insertMessage(
  id: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  sourcesJson?: string | null
): void {
  const stmt = db.prepare(
    'INSERT INTO messages (id, session_id, role, content, sources_json) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(id, sessionId, role, content, sourcesJson ?? null);
}

export function getMessagesBySessionId(sessionId: string) {
  return db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(sessionId) as any[];
}

export function getMessageById(id: string) {
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as any | undefined;
}

// Feedback
export function insertFeedback(id: string, messageId: string, rating: 'up' | 'down'): void {
  const stmt = db.prepare('INSERT INTO feedback (id, message_id, rating) VALUES (?, ?, ?)');
  stmt.run(id, messageId, rating);
}

export function getFeedbackByMessageId(messageId: string) {
  return db.prepare('SELECT * FROM feedback WHERE message_id = ?').get(messageId) as any | undefined;
}

export function updateFeedbackRating(messageId: string, rating: 'up' | 'down'): void {
  db.prepare("UPDATE feedback SET rating = ?, updated_at = datetime('now') WHERE message_id = ?").run(rating, messageId);
}

// Transaction helper
export function runInTransaction<T>(fn: () => T): T {
  const transaction = db.transaction(fn);
  return transaction();
}

// Export the singleton database instance
export default db;
