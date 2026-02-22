import type { NextFunction, Request, Response } from 'express';

interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('API error:', err);

  const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      details: err.details,
    },
  });
}


