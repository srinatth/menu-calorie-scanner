import { ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err instanceof ApiError ? err.status : 500;
  const code = err instanceof ApiError ? err.code : 'internal_error';
  const message = err instanceof Error ? err.message : 'Unexpected error';

  if (status >= 500) {
    logger.error('Unhandled request error', { path: req.path, error: message });
  }

  res.status(status).json({ error: { code, message } });
};
