import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import {
  getAllSessions,
  getSessionById,
  getMessagesBySessionId,
  insertSession,
  getFeedbackByMessageId,
} from '../db.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/sessions — list all sessions ordered by most recent, with preview
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = getAllSessions(); // already ordered by updated_at DESC

    const summaries = sessions.map((s: any) => {
      const messages = getMessagesBySessionId(s.id);
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      const preview = lastMessage ? lastMessage.content.slice(0, 100) : '';

      return {
        id: s.id,
        title: s.title,
        preview,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    });

    res.json({ sessions: summaries });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id — full message history with feedback
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = getSessionById(req.params.id);
    if (!session) {
      throw new AppError('Session not found.', 'not_found', 404);
    }

    const rows = getMessagesBySessionId(req.params.id);
    const messages = rows.map((m: any) => {
      const fb = getFeedbackByMessageId(m.id);
      return {
        id: m.id,
        sessionId: m.session_id,
        role: m.role,
        content: m.content,
        sources: m.sources_json ? JSON.parse(m.sources_json) : undefined,
        feedback: fb ? fb.rating : null,
        createdAt: m.created_at,
      };
    });

    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions — create a new empty session
router.post('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = randomUUID();
    insertSession(sessionId);
    res.status(201).json({ sessionId });
  } catch (err) {
    next(err);
  }
});

export default router;
