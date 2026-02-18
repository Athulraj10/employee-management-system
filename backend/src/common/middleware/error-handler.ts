import type { NextFunction, Request, Response } from 'express';

interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

// Centralized error handler to keep APIs idempotent and predictable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // eslint-disable-next-line no-console
  console.error('API error:', err);

  const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      details: err.details,
    },
  });
}


