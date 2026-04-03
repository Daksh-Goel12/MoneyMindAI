import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import {
  insertFeedback,
  updateFeedbackRating,
  getFeedbackByMessageId,
  getMessageById,
} from '../db.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/feedback — submit feedback
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId, rating } = req.body;

    if (!messageId || typeof messageId !== 'string') {
      throw new AppError('messageId is required.', 'validation_error', 400);
    }
    if (rating !== 'up' && rating !== 'down') {
      throw new AppError("rating must be 'up' or 'down'.", 'validation_error', 400);
    }

    const message = getMessageById(messageId);
    if (!message) {
      throw new AppError('Message not found.', 'not_found', 404);
    }

    const existing = getFeedbackByMessageId(messageId);
    if (existing) {
      updateFeedbackRating(messageId, rating);
    } else {
      insertFeedback(randomUUID(), messageId, rating);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/feedback/:messageId — update existing feedback
router.put('/:messageId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const { rating } = req.body;

    if (rating !== 'up' && rating !== 'down') {
      throw new AppError("rating must be 'up' or 'down'.", 'validation_error', 400);
    }

    const existing = getFeedbackByMessageId(messageId);
    if (!existing) {
      throw new AppError('Feedback not found for this message.', 'not_found', 404);
    }

    updateFeedbackRating(messageId, rating);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
