// frontend/src/pages/CaseDetail.tsx
// Detailed view of a triage case with Q&A timeline, outcome, and review functionality
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../services/api';

interface CaseData {
    sessionId: string;
    primaryComplaint: string;
    category: string;
    ageRange: string;
    gender: string;
    language: string;
    answers: {
        questionId: string;
        questionText: string;
        answer: string;
        answerLabel: string;
        score: number;
    }[];
    riskBand: 'GREEN' | 'YELLOW' | 'RED';
    reasonCodes: string[];
    summary: string;
    userMessage: string;
    recommendedAction: string;
    followupRecommendations: string[];
    status: string;
    reviewNotes: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    createdAt: string;
}

export default function CaseDetail() {
    const { t } = useLanguage();
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState<CaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [reviewing, setReviewing] = useState(false);
    const [reviewed, setReviewed] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('swasthai_token')) {
            navigate('/login');
            return;
        }
        fetchCase();
    }, [sessionId]);

    async function fetchCase() {
        try {
            const data = await api.getCaseDetail(sessionId!);
            setCaseData(data.case);
            setNotes(data.case.reviewNotes || '');
            setReviewed(data.case.status === 'REVIEWED');
        } catch (err: any) {
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    }

    async function handleReview() {
        if (!sessionId) return;
        setReviewing(true);
        try {
            await api.reviewCase(sessionId, notes);
            setReviewed(true);
        } catch (err) {
            console.error('Review failed:', err);
        } finally {
            setReviewing(false);
        }
    }

    if (loading) {
        return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-500">{t('common.loading')}</div>;
    }

    if (!caseData) {
        return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-500">{t('common.error')}</div>;
    }

    const riskColors = {
        GREEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        YELLOW: 'bg-amber-100 text-amber-700 border-amber-200',
        RED: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-4 font-medium"
                id="back-to-dashboard"
            >
                ← {t('dashboard.backToList')}
            </button>

            <div className="space-y-6 animate-fade-in">
                {/* Case Header */}
                <div className="glass-card p-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1">Case: {caseData.sessionId.slice(0, 8)}...</h2>
                            <p className="text-sm text-slate-500">{new Date(caseData.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${riskColors[caseData.riskBand]}`}>
                            {caseData.riskBand === 'RED' ? '🔴' : caseData.riskBand === 'YELLOW' ? '🟡' : '🟢'} {caseData.riskBand}
                        </span>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                            <span className="text-slate-500">Category:</span>{' '}
                            <span className="font-medium">{caseData.category}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                            <span className="text-slate-500">Age:</span>{' '}
                            <span className="font-medium">{caseData.ageRange}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                            <span className="text-slate-500">Status:</span>{' '}
                            <span className={`font-medium ${reviewed ? 'text-green-600' : 'text-amber-600'}`}>
                                {reviewed ? 'REVIEWED' : caseData.status}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 bg-slate-50 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Primary Complaint</h4>
                        <p className="text-slate-800">{caseData.primaryComplaint}</p>
                    </div>
                </div>

                {/* Q&A Timeline */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t('dashboard.qaTimeline')}</h3>
                    <div className="space-y-3">
                        {caseData.answers.map((a, i) => (
                            <div key={i} className="border-l-2 border-primary-200 pl-4 py-2">
                                <p className="text-sm text-slate-600 font-medium">Q{i + 1}: {a.questionText}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-lg font-medium">
                                        {a.answerLabel}
                                    </span>
                                    <span className="text-xs text-slate-400">Score: {a.score}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Triage Outcome */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t('dashboard.triageOutcome')}</h3>
                    <div className="bg-slate-50 rounded-xl p-4 mb-3">
                        <p className="text-sm text-slate-700 leading-relaxed">{caseData.userMessage}</p>
                    </div>
                    {caseData.reasonCodes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {caseData.reasonCodes.map((code, i) => (
                                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">
                                    {code}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Review Section */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t('dashboard.reviewNotes')}</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('dashboard.notesPlaceholder')}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 bg-slate-50 min-h-[100px]"
                        disabled={reviewed}
                        id="review-notes"
                    />
                    {!reviewed ? (
                        <button
                            onClick={handleReview}
                            disabled={reviewing}
                            className="mt-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all"
                            id="mark-reviewed-btn"
                        >
                            {reviewing ? '...' : t('dashboard.markReviewed')}
                        </button>
                    ) : (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm">
                            ✅ Reviewed{caseData.reviewedBy ? ` by ${caseData.reviewedBy}` : ''}{caseData.reviewedAt ? ` on ${new Date(caseData.reviewedAt).toLocaleString()}` : ''}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
