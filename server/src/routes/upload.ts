import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { processUpload, deleteUploadedDocument } from '../services/uploadPipeline.js';
import { getAllDocuments } from '../db.js';
import { AppError } from '../middleware/errorHandler.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req: Request, file: { mimetype: string }, cb: FileFilterCallback) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new AppError('Only PDF files are supported.', 'validation_error', 400));
      return;
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

// POST /api/upload — multipart PDF upload
uploadRouter.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file provided.', 'validation_error', 400);
      }

      const result = await processUpload(req.file.buffer, req.file.originalname);
      res.status(201).json({ documentId: result.documentId, name: result.name });
    } catch (err) {
      next(err);
    }
  }
);

export const documentsRouter = Router();

// GET /api/documents — list uploaded documents
documentsRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const allDocs = getAllDocuments();
    const uploaded = allDocs
      .filter((d: any) => d.type === 'uploaded')
      .map((d: any) => ({
        id: d.id,
        name: d.name,
        filename: d.filename,
        createdAt: d.created_at,
      }));
    res.json({ documents: uploaded });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id — delete uploaded document
documentsRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    deleteUploadedDocument(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
