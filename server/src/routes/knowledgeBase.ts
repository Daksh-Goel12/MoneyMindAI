import { Router, Request, Response, NextFunction } from 'express';
import { getAllDocumentsWithSections, searchSections } from '../services/knowledgeBase.js';

const router = Router();

// GET /api/knowledge-base — all documents with sections
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = getAllDocumentsWithSections();
    res.json({ documents });
  } catch (err) {
    next(err);
  }
});

// GET /api/knowledge-base/search?q= — text search
router.get('/search', (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    const results = searchSections(q);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
