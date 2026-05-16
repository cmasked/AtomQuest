import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Global Express error handler.
 * Catches all thrown errors and returns a consistent JSON response.
 */
export function errorHandler(err: Error | AppError, _req: Request, res: Response, _next: NextFunction): void {
  // Handle AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  // Handle legacy { status, message } throws from existing services
  if (typeof (err as any).status === 'number') {
    res.status((err as any).status).json({
      success: false,
      message: (err as any).message || 'Unknown error',
    });
    return;
  }

  // Handle unexpected errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
