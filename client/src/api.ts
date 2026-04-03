import type {
  ChatResponse,
  SessionSummary,
  Message,
  Document,
  Section,
  UploadedDoc,
} from './types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// --- Error handling ---

export type ApiErrorType = 'llm' | 'retrieval' | 'network' | 'rate_limited' | 'unknown';

const ERROR_MESSAGES: Record<ApiErrorType, string> = {
  llm: "We couldn't generate a response right now. Please try again.",
  retrieval: 'We had trouble searching the knowledge base. Please try again.',
  network: "It looks like there's a connection issue. Check your internet and try again.",
  rate_limited: 'The system is busy. Please wait a moment and try again.',
  unknown: 'Something went wrong. Please try again.',
};

export class ApiError extends Error {
  type: ApiErrorType;

  constructor(type: ApiErrorType) {
    super(ERROR_MESSAGES[type]);
    this.type = type;
    this.name = 'ApiError';
  }
}

function mapErrorType(serverType?: string): ApiErrorType {
  if (serverType === 'llm') return 'llm';
  if (serverType === 'retrieval') return 'retrieval';
  if (serverType === 'network') return 'network';
  if (serverType === 'rate_limited') return 'rate_limited';
  return 'unknown';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options?.headers,
      },
    });
  } catch {
    throw new ApiError('network');
  }

  if (!res.ok) {
    let errorType: ApiErrorType = 'unknown';
    try {
      const body = await res.json();
      if (body?.error?.type) {
        errorType = mapErrorType(body.error.type);
      }
    } catch {
      // ignore parse failure
    }
    throw new ApiError(errorType);
  }

  return res.json() as Promise<T>;
}


// --- Chat ---

export async function sendChat(query: string, sessionId: string): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ query, sessionId }),
  });
}

// --- Sessions ---

export async function getSessions(): Promise<{ sessions: SessionSummary[] }> {
  return request<{ sessions: SessionSummary[] }>('/api/sessions');
}

export async function getSession(id: string): Promise<{ messages: Message[] }> {
  return request<{ messages: Message[] }>(`/api/sessions/${encodeURIComponent(id)}`);
}

export async function createSession(): Promise<{ sessionId: string }> {
  return request<{ sessionId: string }>('/api/sessions', { method: 'POST' });
}

// --- Knowledge Base ---

export async function getKnowledgeBase(): Promise<{ documents: Document[] }> {
  return request<{ documents: Document[] }>('/api/knowledge-base');
}

export async function searchKnowledgeBase(q: string): Promise<{ results: Section[] }> {
  return request<{ results: Section[] }>(`/api/knowledge-base/search?q=${encodeURIComponent(q)}`);
}

// --- Upload ---

export async function uploadDocument(file: File): Promise<{ documentId: string; name: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return request<{ documentId: string; name: string }>('/api/upload', {
    method: 'POST',
    body: formData,
  });
}

// --- Documents ---

export async function getDocuments(): Promise<{ documents: UploadedDoc[] }> {
  return request<{ documents: UploadedDoc[] }>('/api/documents');
}

export async function deleteDocument(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// --- Feedback ---

export async function submitFeedback(messageId: string, rating: 'up' | 'down'): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ messageId, rating }),
  });
}

export async function updateFeedback(messageId: string, rating: 'up' | 'down'): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/feedback/${encodeURIComponent(messageId)}`, {
    method: 'PUT',
    body: JSON.stringify({ rating }),
  });
}

// --- Export ---

export async function exportSession(sessionId: string, format: 'pdf' | 'text'): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/export/${encodeURIComponent(sessionId)}?format=${format}`);
  } catch {
    throw new ApiError('network');
  }
  if (!res.ok) throw new ApiError('unknown');
  return res.blob();
}

export async function exportMessage(messageId: string, format: 'pdf' | 'text'): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/export/message/${encodeURIComponent(messageId)}?format=${format}`);
  } catch {
    throw new ApiError('network');
  }
  if (!res.ok) throw new ApiError('unknown');
  return res.blob();
}
