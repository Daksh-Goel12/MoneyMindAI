export interface Document {
  id: string;
  name: string;
  type: 'curated' | 'uploaded';
  filename?: string;
  sections: Section[];
  createdAt: string;
}

export interface Section {
  id: string;
  documentId: string;
  title: string;
  content: string;
  chunkIndex: number;
}

export interface Source {
  sectionId: string;
  sectionTitle: string;
  documentName: string;
  score: number;
  content: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  feedback?: 'up' | 'down' | null;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedDoc {
  id: string;
  name: string;
  filename: string;
  createdAt: string;
}

export interface ChatRequest {
  query: string;
  sessionId: string;
}

export interface ChatResponse {
  response: string;
  sources: Source[];
  messageId: string;
}

export interface FeedbackRequest {
  messageId: string;
  rating: 'up' | 'down';
}
