// backend/src/index.ts
// Express application entry point
// Initializes server, connects to MongoDB, mounts all routes
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import triageRoutes from './routes/triageRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// --- Health check endpoint ---
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Swasth AI API', timestamp: new Date().toISOString() });
});

// --- Mount API routes ---
app.use('/api/triage', triageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);

// --- Global error handler (must be last) ---
app.use(errorHandler);

// --- Start server ---
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Swasth AI API running on http://localhost:${PORT}`);
            console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
