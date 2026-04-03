import { Router, Request, Response, NextFunction } from 'express';
import { ragPipeline } from '../services/ragPipeline.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, sessionId } = req.body;

    if (!query || typeof query !== 'string') {
      throw new AppError('query is required and must be a string.', 'validation_error', 400);
    }
    if (!sessionId || typeof sessionId !== 'string') {
      throw new AppError('sessionId is required and must be a string.', 'validation_error', 400);
    }

    const result = await ragPipeline.processQuery(query, sessionId);

    res.json({
      response: result.response,
      sources: result.sources,
      messageId: result.messageId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
