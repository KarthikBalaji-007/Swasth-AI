// backend/src/routes/dashboardRoutes.ts
// Routes for the reviewer dashboard — protected by JWT auth
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCases, getCaseDetail, reviewCase, getStats } from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate as any);

// Get paginated list of flagged cases
router.get('/cases', getCases as any);

// Get dashboard statistics
router.get('/stats', getStats as any);

// Get detailed view of a specific case
router.get('/cases/:sessionId', getCaseDetail as any);

// Mark a case as reviewed
router.post('/cases/:sessionId/review', reviewCase as any);

export default router;
