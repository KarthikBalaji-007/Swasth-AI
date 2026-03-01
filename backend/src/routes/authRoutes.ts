// backend/src/routes/authRoutes.ts
// Authentication routes for reviewer login
import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

// Login endpoint
router.post('/login', login);

export default router;
