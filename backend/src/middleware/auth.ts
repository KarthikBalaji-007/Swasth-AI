// backend/src/middleware/auth.ts
// JWT authentication middleware for protecting dashboard routes
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user info from JWT
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        username: string;
        role: string;
    };
}

/**
 * Middleware to verify JWT token from Authorization header.
 * Used to protect dashboard/reviewer routes.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'swasthyapath_default_secret';
        const decoded = jwt.verify(token, secret) as {
            userId: string;
            username: string;
            role: string;
        };

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
}
