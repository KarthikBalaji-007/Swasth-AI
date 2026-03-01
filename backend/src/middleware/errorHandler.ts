// backend/src/middleware/errorHandler.ts
// Global error handler middleware — catches unhandled errors and returns structured responses
import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Global error handler — formats errors consistently for the frontend.
 * Logs error details server-side while returning safe messages to users.
 */
export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
    const statusCode = err.statusCode || 500;

    console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);

    if (statusCode === 500) {
        // Don't leak internal error details to the client
        res.status(500).json({
            error: 'We are facing technical issues. Please try again shortly or contact a healthcare provider directly.',
            code: 'INTERNAL_ERROR'
        });
    } else {
        res.status(statusCode).json({
            error: err.message,
            code: err.code || 'ERROR'
        });
    }
}
