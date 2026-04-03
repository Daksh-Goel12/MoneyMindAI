import express from 'express';
import cors from 'cors';
import pino from 'pino';

// 1. Import db (triggers schema creation)
import './db.js';
import { getAllSections, updateSectionEmbedding } from './db.js';

// Services
import { embeddingService } from './services/embedding.js';
import { vectorStore } from './services/vectorStore.js';
import { seedKnowledgeBase } from './seed/index.js';

// Routes
import chatRouter from './routes/chat.js';
import sessionsRouter from './routes/sessions.js';
import knowledgeBaseRouter from './routes/knowledgeBase.js';
import { uploadRouter, documentsRouter } from './routes/upload.js';
import feedbackRouter from './routes/feedback.js';
import exportRouter from './routes/export.js';

// Middleware
import { errorHandler, rateLimitMiddleware } from './middleware/errorHandler.js';

const logger = pino({ level: 'info' });
const app = express();
const PORT = process.env.PORT || 3001;

// Global middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Apply rate limiter to chat endpoint (Gemini API calls)
app.use('/api/chat', rateLimitMiddleware);

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/knowledge-base', knowledgeBaseRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/export', exportRouter);

// Error handler (must be last)
app.use(errorHandler);

async function startup(): Promise<void> {
  logger.info('Starting MoneyMind AI server...');

  // 2. Seed knowledge base (no-op if already seeded)
  seedKnowledgeBase();
  logger.info('Knowledge base seeded.');

  // 3. Load all sections with embeddings from SQLite
  const sections = getAllSections();
  const sectionsWithEmbeddings: { id: string; vector: number[] }[] = [];
  const sectionsWithoutEmbeddings: { id: string; content: string }[] = [];

  for (const section of sections) {
    if (section.embedding) {
      const float32 = new Float32Array(
        section.embedding.buffer,
        section.embedding.byteOffset,
        section.embedding.byteLength / 4
      );
      sectionsWithEmbeddings.push({ id: section.id, vector: Array.from(float32) });
    } else {
      sectionsWithoutEmbeddings.push({ id: section.id, content: section.content });
    }
  }

  // 4. Generate embeddings for sections that don't have them
  if (sectionsWithoutEmbeddings.length > 0) {
    logger.info(`Generating embeddings for ${sectionsWithoutEmbeddings.length} sections...`);
    try {
      const texts = sectionsWithoutEmbeddings.map((s) => s.content);
      const embeddings = await embeddingService.embedBatch(texts);

      for (let i = 0; i < sectionsWithoutEmbeddings.length; i++) {
        const buffer = Buffer.from(new Float32Array(embeddings[i]).buffer);
        updateSectionEmbedding(sectionsWithoutEmbeddings[i].id, buffer);
        sectionsWithEmbeddings.push({
          id: sectionsWithoutEmbeddings[i].id,
          vector: embeddings[i],
        });
      }
      logger.info('Embeddings generated and stored.');
    } catch (err) {
      logger.warn({ err }, 'Failed to generate embeddings on startup. Vector search will be limited.');
    }
  }

  // 5. Initialize vector store with all section embeddings
  vectorStore.initialize(sectionsWithEmbeddings);
  logger.info(`Vector store initialized with ${sectionsWithEmbeddings.length} vectors.`);

  // 6. Start Express server
  app.listen(PORT, () => {
    logger.info(`MoneyMind AI server listening on port ${PORT}`);
  });
}

startup().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

export default app;
