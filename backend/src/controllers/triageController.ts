// backend/src/controllers/triageController.ts
// Handles the triage workflow: starting sessions, answering questions, computing outcomes
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import TriageSession from '../models/TriageSession';
import * as rulesEngine from '../services/rulesEngine';
import * as aiService from '../services/aiService';

/**
 * POST /api/triage/start
 * Start a new triage session. Accepts primary complaint, optional demographics.
 * Returns session ID and first question (or immediate RED for emergencies).
 */
export async function startTriage(req: Request, res: Response): Promise<void> {
    try {
        const { primaryComplaint, ageRange, gender, language } = req.body;

        // --- Validate input ---
        if (!primaryComplaint || typeof primaryComplaint !== 'string') {
            res.status(400).json({ error: 'Please describe your symptoms.', code: 'MISSING_COMPLAINT' });
            return;
        }

        const trimmedComplaint = primaryComplaint.trim();
        if (trimmedComplaint.length < 5) {
            res.status(400).json({
                error: 'Please describe your symptoms in at least a few words.',
                code: 'COMPLAINT_TOO_SHORT'
            });
            return;
        }
        if (trimmedComplaint.length > 512) {
            res.status(400).json({
                error: 'Please keep your symptom description under 512 characters.',
                code: 'COMPLAINT_TOO_LONG'
            });
            return;
        }

        const sessionId = uuidv4();
        const lang = language || 'en';

        // --- Check for emergency keywords (immediate RED) ---
        if (rulesEngine.detectEmergency(trimmedComplaint)) {
            const emergencySession = new TriageSession({
                sessionId,
                primaryComplaint: trimmedComplaint,
                category: 'emergency',
                ageRange: ageRange || 'adult',
                gender: gender || 'prefer_not_to_say',
                language: lang,
                isComplete: true,
                riskBand: 'RED',
                reasonCodes: ['EMERGENCY_KEYWORD_DETECTED'],
                summary: `Emergency keywords detected in: ${trimmedComplaint}`,
                userMessage: aiService.getEmergencyMessage(lang),
                recommendedAction: 'URGENT_CARE',
                followupRecommendations: aiService.getSafetyNetAdvice(lang),
                status: 'NEW'
            });

            await emergencySession.save();

            res.json({
                sessionId,
                isComplete: true,
                triageResult: {
                    riskBand: 'RED',
                    summary: emergencySession.summary,
                    userMessage: emergencySession.userMessage,
                    recommendedAction: 'URGENT_CARE',
                    followupRecommendations: emergencySession.followupRecommendations,
                    disclaimer: aiService.getDisclaimer(lang)
                }
            });
            return;
        }

        // --- Categorize the complaint ---
        // Step 1: Try keyword-based categorization (primary method)
        let category = rulesEngine.categorizeComplaint(trimmedComplaint);

        // Step 2: If keyword matching fails, try AI-based categorization (helper)
        if (!category) {
            category = await aiService.categorizeWithAI(trimmedComplaint);
        }

        // Step 3: If neither method could categorize, inform the user
        if (!category) {
            res.json({
                sessionId,
                isComplete: true,
                unsupported: true,
                message: lang === 'hi'
                    ? 'क्षमा करें, हम इन लक्षणों का आकलन करने में असमर्थ हैं। कृपया सीधे एक स्वास्थ्य सेवा प्रदाता से संपर्क करें।'
                    : lang === 'ta'
                        ? 'மன்னிக்கவும், இந்த அறிகுறிகளை மதிப்பிட எங்களால் இயலவில்லை. நேரடியாக மருத்துவரை அணுகவும்.'
                        : 'Sorry, we are unable to assess these symptoms. Please contact a healthcare provider directly.',
                disclaimer: aiService.getDisclaimer(lang)
            });
            return;
        }

        // --- Create session and return first question ---
        const firstQuestion = rulesEngine.getQuestion(category, 0);
        if (!firstQuestion) {
            res.status(500).json({ error: 'Failed to load question flow.', code: 'QUESTION_LOAD_ERROR' });
            return;
        }

        const session = new TriageSession({
            sessionId,
            primaryComplaint: trimmedComplaint,
            category,
            ageRange: ageRange || 'adult',
            gender: gender || 'prefer_not_to_say',
            language: lang,
            currentQuestionIndex: 0,
            isComplete: false,
            status: 'NEW'
        });

        await session.save();

        res.json({
            sessionId,
            isComplete: false,
            category,
            categoryName: rulesEngine.getCategoryName(category, lang),
            totalQuestions: rulesEngine.getQuestionCount(category),
            currentQuestion: {
                index: 0,
                id: firstQuestion.id,
                text: firstQuestion.text[lang] || firstQuestion.text['en'],
                type: firstQuestion.type,
                options: firstQuestion.options.map(o => ({
                    value: o.value,
                    label: o.label[lang] || o.label['en']
                }))
            },
            disclaimer: aiService.getDisclaimer(lang)
        });
    } catch (error) {
        console.error('Error starting triage:', error);
        res.status(500).json({
            error: 'We are facing technical issues. Please try again shortly.',
            code: 'SERVER_ERROR'
        });
    }
}

/**
 * POST /api/triage/answer
 * Submit an answer to the current question. Returns next question or final triage result.
 */
export async function answerQuestion(req: Request, res: Response): Promise<void> {
    try {
        const { sessionId, questionId, answer } = req.body;

        // --- Validate input ---
        if (!sessionId || !questionId || !answer) {
            res.status(400).json({ error: 'Missing required fields.', code: 'MISSING_FIELDS' });
            return;
        }

        // --- Find session ---
        const session = await TriageSession.findOne({ sessionId });
        if (!session) {
            res.status(404).json({ error: 'Session not found.', code: 'SESSION_NOT_FOUND' });
            return;
        }
        if (session.isComplete) {
            res.status(400).json({ error: 'This session is already complete.', code: 'SESSION_COMPLETE' });
            return;
        }

        const lang = session.language || 'en';

        // --- Validate the answer value against the question options ---
        const optionData = rulesEngine.validateAnswer(session.category, questionId, answer);
        if (!optionData) {
            res.status(400).json({ error: 'Invalid answer for this question.', code: 'INVALID_ANSWER' });
            return;
        }

        // --- Record the answer ---
        const currentQuestion = rulesEngine.getQuestion(session.category, session.currentQuestionIndex);
        if (!currentQuestion || currentQuestion.id !== questionId) {
            res.status(400).json({ error: 'Question mismatch.', code: 'QUESTION_MISMATCH' });
            return;
        }

        session.answers.push({
            questionId,
            questionText: currentQuestion.text['en'], // Store English for reviewer dashboard
            answer,
            answerLabel: optionData.label['en'] || answer,
            score: optionData.score
        });

        const nextIndex = session.currentQuestionIndex + 1;
        const totalQuestions = rulesEngine.getQuestionCount(session.category);

        // --- Check if there are more questions ---
        if (nextIndex < totalQuestions) {
            // More questions to ask
            session.currentQuestionIndex = nextIndex;
            await session.save();

            const nextQuestion = rulesEngine.getQuestion(session.category, nextIndex);
            if (!nextQuestion) {
                res.status(500).json({ error: 'Failed to load next question.', code: 'QUESTION_LOAD_ERROR' });
                return;
            }

            res.json({
                sessionId,
                isComplete: false,
                totalQuestions,
                currentQuestion: {
                    index: nextIndex,
                    id: nextQuestion.id,
                    text: nextQuestion.text[lang] || nextQuestion.text['en'],
                    type: nextQuestion.type,
                    options: nextQuestion.options.map(o => ({
                        value: o.value,
                        label: o.label[lang] || o.label['en']
                    }))
                }
            });
        } else {
            // All questions answered — compute triage outcome
            const triageResult = rulesEngine.evaluate(
                session.category,
                session.answers.map(a => ({
                    questionId: a.questionId,
                    answer: a.answer,
                    score: a.score
                })),
                session.primaryComplaint,
                lang
            );

            // Generate AI explanation text (or fallback)
            const userMessage = await aiService.generateExplanation({
                summary: triageResult.summary,
                riskBand: triageResult.riskBand,
                recommendedAction: triageResult.recommendedAction,
                language: lang
            });

            const safetyNet = aiService.getSafetyNetAdvice(lang);

            // Update session with final outcome
            session.isComplete = true;
            session.currentQuestionIndex = nextIndex;
            session.riskBand = triageResult.riskBand;
            session.reasonCodes = triageResult.reasonCodes;
            session.summary = triageResult.summary;
            session.userMessage = userMessage;
            session.recommendedAction = triageResult.recommendedAction;
            session.followupRecommendations = safetyNet;

            await session.save();

            res.json({
                sessionId,
                isComplete: true,
                triageResult: {
                    riskBand: triageResult.riskBand,
                    reasonCodes: triageResult.reasonCodes,
                    summary: triageResult.summary,
                    userMessage,
                    recommendedAction: triageResult.recommendedAction,
                    followupRecommendations: safetyNet,
                    disclaimer: aiService.getDisclaimer(lang)
                }
            });
        }
    } catch (error) {
        console.error('Error answering question:', error);
        res.status(500).json({
            error: 'We are facing technical issues. Please try again shortly.',
            code: 'SERVER_ERROR'
        });
    }
}
