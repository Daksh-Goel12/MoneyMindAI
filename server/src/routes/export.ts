import { Router, Request, Response, NextFunction } from 'express';
import { getMessagesBySessionId, getSessionById, getMessageById } from '../db.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

function formatMessagesAsText(messages: any[]): string {
  return messages
    .map((m: any) => {
      const role = m.role === 'user' ? 'You' : 'MoneyMind AI';
      return `${role}:\n${m.content}`;
    })
    .join('\n\n---\n\n');
}

// GET /api/export/:sessionId?format=pdf|text — export full conversation
router.get('/:sessionId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const format = (req.query.format as string) || 'text';

    const session = getSessionById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 'not_found', 404);
    }

    const messages = getMessagesBySessionId(sessionId);
    if (messages.length === 0) {
      throw new AppError('No messages in this session.', 'not_found', 404);
    }

    const text = formatMessagesAsText(messages);

    if (format === 'pdf') {
      // Send as text with PDF content-disposition (client-side jsPDF handles real PDF)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.txt"`);
      res.send(text);
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.txt"`);
      res.send(text);
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/export/message/:messageId?format=pdf|text — export individual response
router.get('/message/:messageId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const format = (req.query.format as string) || 'text';

    const message = getMessageById(messageId);
    if (!message) {
      throw new AppError('Message not found.', 'not_found', 404);
    }

    // Find the preceding user message in the same session
    const sessionMessages = getMessagesBySessionId(message.session_id);
    let userQuery = '';
    for (let i = 0; i < sessionMessages.length; i++) {
      if (sessionMessages[i].id === messageId && i > 0 && sessionMessages[i - 1].role === 'user') {
        userQuery = sessionMessages[i - 1].content;
        break;
      }
    }

    const parts: any[] = [];
    if (userQuery) {
      parts.push({ role: 'user', content: userQuery });
    }
    parts.push({ role: message.role, content: message.content });

    const text = formatMessagesAsText(parts);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="response-${messageId}.txt"`);
      res.send(text);
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="response-${messageId}.txt"`);
      res.send(text);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
