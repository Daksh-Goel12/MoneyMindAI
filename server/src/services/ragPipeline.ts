import { randomUUID } from 'crypto';
import { embeddingService, EmbeddingService } from './embedding.js';
import { vectorStore, VectorStore } from './vectorStore.js';
import { llmService, LLMService } from './llm.js';
import {
  insertMessage,
  getSessionById,
  insertSession,
  updateSessionTimestamp,
  updateSessionTitle,
  getSectionById,
  getDocumentById,
} from '../db.js';
import type { Source } from '../types.js';

const TOP_K = 5;

export class RAGPipeline {
  constructor(
    private embeddingService: EmbeddingService,
    private vectorStore: VectorStore,
    private llmService: LLMService
  ) {}

  async processQuery(
    query: string,
    sessionId: string
  ): Promise<{ response: string; sources: Source[]; messageId: string }> {
    // Ensure session exists
    const session = getSessionById(sessionId);
    if (!session) {
      insertSession(sessionId);
      updateSessionTitle(sessionId, query.slice(0, 100));
    }

    // Save user message
    const userMessageId = randomUUID();
    insertMessage(userMessageId, sessionId, 'user', query);

    let sources: Source[] = [];
    let context: string[] = [];

    // Check if vector store has any data
    if (this.vectorStore.size === 0) {
      // Graceful degradation — no knowledge base indexed yet
      context = [];
    } else {
      // 1. Embed the user query
      const queryVector = await this.embeddingService.embed(query);

      // 2. Search for top-K similar sections
      const results = this.vectorStore.search(queryVector, TOP_K);

      // 3. Look up full section content and parent document for each result
      for (const result of results) {
        const section = getSectionById(result.id);
        if (!section) continue;

        const document = getDocumentById(section.document_id);
        const documentName = document?.name ?? 'Unknown Document';

        sources.push({
          sectionId: section.id,
          sectionTitle: section.title,
          documentName,
          score: result.score,
          content: section.content,
        });

        context.push(`[${section.title}] (from ${documentName})\n${section.content}`);
      }
    }

    // 4. Generate response via LLM
    let responseText: string;

    if (this.vectorStore.size === 0) {
      // Direct LLM call with disclaimer when vector store is empty
      responseText = await this.llmService.generateResponse(query, []);
      responseText =
        'Note: The knowledge base has not been indexed yet, so this response is not grounded in the curated financial guides.\n\n' +
        responseText;
    } else if (sources.length === 0) {
      // Vector store has data but nothing relevant was found
      responseText =
        "I couldn't find any relevant information in the knowledge base for your question. " +
        'Could you try rephrasing your question or asking about budgeting, loans, investing, credit, or business finance?';
    } else {
      responseText = await this.llmService.generateResponse(query, context);
    }

    // 5. Save assistant message with sources
    const assistantMessageId = randomUUID();
    const sourcesJson = sources.length > 0 ? JSON.stringify(sources) : null;
    insertMessage(assistantMessageId, sessionId, 'assistant', responseText, sourcesJson);

    // 6. Update session timestamp
    updateSessionTimestamp(sessionId);

    // Set session title from first query if this is a new session
    if (!session) {
      updateSessionTitle(sessionId, query.slice(0, 100));
    }

    return {
      response: responseText,
      sources,
      messageId: assistantMessageId,
    };
  }
}

// Singleton instance
export const ragPipeline = new RAGPipeline(embeddingService, vectorStore, llmService);
