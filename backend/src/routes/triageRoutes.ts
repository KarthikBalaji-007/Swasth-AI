// backend/src/routes/triageRoutes.ts
// Routes for the triage workflow — publicly accessible (no auth needed)
import { Router } from 'express';
import { startTriage, answerQuestion } from '../controllers/triageController';

const router = Router();

// Start a new triage session
router.post('/start', startTriage);

// Submit an answer to a question
router.post('/answer', answerQuestion);

export default router;
