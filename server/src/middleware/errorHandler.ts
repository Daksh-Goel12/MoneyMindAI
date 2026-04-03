import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Custom application error with type and status code.
 */
export class AppError extends Error {
  public readonly type: string;
  public readonly statusCode: number;

  constructor(message: string, type: string, statusCode: number) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Express error-handling middleware.
 * Returns structured JSON: { error: { type, message } }
 * Logs full error details server-side, never exposes internals to client.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err }, 'Unhandled error');

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { type: err.type, message: err.message },
    });
    return;
  }

  // Map common error patterns
  if (err.message?.includes('not found') || err.message?.includes('Not found')) {
    res.status(404).json({
      error: { type: 'not_found', message: 'The requested resource was not found.' },
    });
    return;
  }

  if (err.message?.includes('validation') || err.message?.includes('invalid') || err.message?.includes('Invalid')) {
    res.status(400).json({
      error: { type: 'validation_error', message: 'The request was invalid. Please check your input.' },
    });
    return;
  }

  // Default 500
  res.status(500).json({
    error: { type: 'internal_error', message: 'An unexpected error occurred. Please try again later.' },
  });
}

/**
 * Simple token-bucket rate limiter for Gemini API calls.
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number = 10,
    private refillRate: number = 2, // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  tryConsume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

export const geminiRateLimiter = new TokenBucketRateLimiter();

/**
 * Express middleware that checks the rate limiter before proceeding.
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!geminiRateLimiter.tryConsume()) {
    res.status(429).json({
      error: {
        type: 'rate_limited',
        message: 'The system is busy. Please wait a moment and try again.',
      },
    });
    return;
  }
  next();
}
