// backend/src/models/TriageSession.ts
// Stores complete triage session data: complaint, Q&A flow, and final outcome
import mongoose, { Schema, Document } from 'mongoose';

// Interface for individual Q&A entries in the session
interface IAnswer {
    questionId: string;
    questionText: string;
    answer: string;
    answerLabel: string;
    score: number;
}

// Main triage session document interface
export interface ITriageSession extends Document {
    sessionId: string;
    primaryComplaint: string;
    category: string;
    ageRange: string;
    gender: string;
    language: string;
    answers: IAnswer[];
    currentQuestionIndex: number;
    isComplete: boolean;
    // Triage outcome fields (populated after completion)
    riskBand: 'GREEN' | 'YELLOW' | 'RED' | null;
    reasonCodes: string[];
    summary: string;
    userMessage: string;
    recommendedAction: 'SELF_CARE' | 'NON_URGENT_CONSULT' | 'URGENT_CARE' | null;
    followupRecommendations: string[];
    // Review tracking
    status: 'NEW' | 'IN_REVIEW' | 'REVIEWED';
    reviewNotes: string;
    reviewedAt: Date | null;
    reviewedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const AnswerSchema = new Schema({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    answer: { type: String, required: true },
    answerLabel: { type: String, required: true },
    score: { type: Number, required: true }
});

const TriageSessionSchema = new Schema<ITriageSession>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        primaryComplaint: { type: String, required: true },
        category: { type: String, required: true },
        ageRange: { type: String, default: 'adult' },
        gender: { type: String, default: 'prefer_not_to_say' },
        language: { type: String, default: 'en' },
        answers: { type: [AnswerSchema], default: [] },
        currentQuestionIndex: { type: Number, default: 0 },
        isComplete: { type: Boolean, default: false },
        riskBand: { type: String, enum: ['GREEN', 'YELLOW', 'RED', null], default: null },
        reasonCodes: { type: [String], default: [] },
        summary: { type: String, default: '' },
        userMessage: { type: String, default: '' },
        recommendedAction: {
            type: String,
            enum: ['SELF_CARE', 'NON_URGENT_CONSULT', 'URGENT_CARE', null],
            default: null
        },
        followupRecommendations: { type: [String], default: [] },
        status: { type: String, enum: ['NEW', 'IN_REVIEW', 'REVIEWED'], default: 'NEW' },
        reviewNotes: { type: String, default: '' },
        reviewedAt: { type: Date, default: null },
        reviewedBy: { type: String, default: null }
    },
    { timestamps: true }
);

export default mongoose.model<ITriageSession>('TriageSession', TriageSessionSchema);
