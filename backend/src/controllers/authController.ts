// backend/src/controllers/authController.ts
// Authentication controller for reviewer/admin dashboard login
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

/**
 * POST /api/auth/login
 * Authenticates reviewer/admin and returns JWT token.
 */
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required.', code: 'MISSING_CREDENTIALS' });
            return;
        }

        // Find user by username
        const user = await User.findOne({ username: username.trim().toLowerCase() });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials.', code: 'INVALID_CREDENTIALS' });
            return;
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials.', code: 'INVALID_CREDENTIALS' });
            return;
        }

        // Generate JWT token (24h expiry for demo)
        const secret = process.env.JWT_SECRET || 'swasthyapath_default_secret';
        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            secret,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                username: user.username,
                displayName: user.displayName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed. Please try again.', code: 'SERVER_ERROR' });
    }
}
