// backend/src/controllers/dashboardController.ts
// Dashboard endpoints for reviewers to view and manage flagged triage cases
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import TriageSession from '../models/TriageSession';

/**
 * GET /api/dashboard/cases
 * Returns filtered list of Yellow/Red triage cases for review.
 * Query params: riskBand, status, limit, page
 */
export async function getCases(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { riskBand, status, limit = '20', page = '1' } = req.query;

        // Build filter — only show completed cases with Yellow or Red bands
        const filter: Record<string, any> = {
            isComplete: true,
            riskBand: { $in: ['YELLOW', 'RED'] }
        };

        if (riskBand && (riskBand === 'YELLOW' || riskBand === 'RED')) {
            filter.riskBand = riskBand;
        }
        if (status && ['NEW', 'IN_REVIEW', 'REVIEWED'].includes(status as string)) {
            filter.status = status;
        }

        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1) * limitNum;

        const [cases, total] = await Promise.all([
            TriageSession.find(filter)
                .select('sessionId primaryComplaint category riskBand recommendedAction status createdAt ageRange summary')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            TriageSession.countDocuments(filter)
        ]);

        res.json({
            cases,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching cases:', error);
        res.status(500).json({ error: 'Failed to load cases.', code: 'SERVER_ERROR' });
    }
}

/**
 * GET /api/dashboard/cases/:sessionId
 * Get full details of a specific triage case, including Q&A timeline.
 */
export async function getCaseDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { sessionId } = req.params;

        const session = await TriageSession.findOne({ sessionId }).lean();
        if (!session) {
            res.status(404).json({ error: 'Case not found.', code: 'NOT_FOUND' });
            return;
        }

        res.json({ case: session });
    } catch (error) {
        console.error('Error fetching case detail:', error);
        res.status(500).json({ error: 'Failed to load case details.', code: 'SERVER_ERROR' });
    }
}

/**
 * POST /api/dashboard/cases/:sessionId/review
 * Mark a case as reviewed with optional notes.
 */
export async function reviewCase(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { sessionId } = req.params;
        const { notes } = req.body;

        const session = await TriageSession.findOne({ sessionId });
        if (!session) {
            res.status(404).json({ error: 'Case not found.', code: 'NOT_FOUND' });
            return;
        }

        session.status = 'REVIEWED';
        session.reviewNotes = notes || '';
        session.reviewedAt = new Date();
        session.reviewedBy = req.user?.username || 'unknown';
        await session.save();

        res.json({
            message: 'Case marked as reviewed.',
            case: {
                sessionId: session.sessionId,
                status: session.status,
                reviewedAt: session.reviewedAt,
                reviewedBy: session.reviewedBy,
                reviewNotes: session.reviewNotes
            }
        });
    } catch (error) {
        console.error('Error reviewing case:', error);
        res.status(500).json({ error: 'Failed to update case.', code: 'SERVER_ERROR' });
    }
}

/**
 * GET /api/dashboard/stats
 * Basic aggregate stats for the dashboard overview.
 */
export async function getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
        const [
            totalSessions,
            completedSessions,
            greenCount,
            yellowCount,
            redCount,
            reviewedCount,
            pendingCount
        ] = await Promise.all([
            TriageSession.countDocuments(),
            TriageSession.countDocuments({ isComplete: true }),
            TriageSession.countDocuments({ riskBand: 'GREEN', isComplete: true }),
            TriageSession.countDocuments({ riskBand: 'YELLOW', isComplete: true }),
            TriageSession.countDocuments({ riskBand: 'RED', isComplete: true }),
            TriageSession.countDocuments({ status: 'REVIEWED' }),
            TriageSession.countDocuments({ status: 'NEW', riskBand: { $in: ['YELLOW', 'RED'] }, isComplete: true })
        ]);

        res.json({
            totalSessions,
            completedSessions,
            riskDistribution: { green: greenCount, yellow: yellowCount, red: redCount },
            reviewedCount,
            pendingReview: pendingCount
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to load statistics.', code: 'SERVER_ERROR' });
    }
}
