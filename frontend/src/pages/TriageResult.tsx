// frontend/src/pages/TriageResult.tsx
// Displays the triage outcome with risk band, explanation, and safety reminders
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface TriageResultData {
    riskBand: 'GREEN' | 'YELLOW' | 'RED';
    summary: string;
    userMessage: string;
    recommendedAction: string;
    followupRecommendations: string[];
    disclaimer: string;
    reasonCodes?: string[];
}

// Risk band visual config
const riskConfig = {
    GREEN: {
        gradient: 'from-emerald-500 to-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        glow: 'risk-green',
        icon: '✅',
        barColor: 'bg-emerald-500',
    },
    YELLOW: {
        gradient: 'from-amber-500 to-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        glow: 'risk-yellow',
        icon: '⚠️',
        barColor: 'bg-amber-500',
    },
    RED: {
        gradient: 'from-red-500 to-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        glow: 'risk-red',
        icon: '🚨',
        barColor: 'bg-red-500',
    },
};

export default function TriageResult() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { sessionId } = useParams();

    // Get result from navigation state
    const result: TriageResultData | null = location.state?.triageResult || null;

    if (!result) {
        return (
            <div className="max-w-lg mx-auto px-4 py-12 text-center">
                <div className="glass-card p-8">
                    <p className="text-slate-600 mb-4">{t('common.error')}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-primary-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-700"
                    >
                        {t('common.home')}
                    </button>
                </div>
            </div>
        );
    }

    const config = riskConfig[result.riskBand];

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 text-center mb-6">{t('result.title')}</h2>

                {/* Risk Band Card */}
                <div className={`glass-card overflow-hidden ${config.glow}`}>
                    {/* Color Bar */}
                    <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

                    {/* Risk Band Header */}
                    <div className={`${config.bg} px-6 py-5 border-b ${config.border}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{config.icon}</span>
                            <div>
                                <h3 className={`text-xl font-bold ${config.text}`}>
                                    {t(`result.${result.riskBand}`)}
                                </h3>
                                <p className={`text-sm ${config.text} opacity-80`}>
                                    {t(`result.${result.riskBand.toLowerCase()}Desc`)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI-Generated Explanation */}
                    <div className="px-6 py-5 border-b border-slate-100">
                        <p className="text-slate-700 leading-relaxed">{result.userMessage}</p>
                    </div>

                    {/* Recommended Action */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase mb-2">
                            {t('result.recommendedAction')}
                        </h4>
                        <div className={`${config.bg} ${config.border} border rounded-xl px-4 py-3`}>
                            <p className={`font-medium ${config.text}`}>
                                {t(`result.${result.recommendedAction}`)}
                            </p>
                        </div>
                    </div>

                    {/* Safety Reminders */}
                    {result.followupRecommendations && result.followupRecommendations.length > 0 && (
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h4 className="text-sm font-semibold text-slate-500 uppercase mb-3">
                                {t('result.safetyReminders')}
                            </h4>
                            <ul className="space-y-2">
                                {result.followupRecommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Disclaimer */}
                    <div className="px-6 py-3 bg-slate-50">
                        <p className="text-xs text-slate-500">{result.disclaimer}</p>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 text-center">
                    <button
                        id="new-assessment-btn"
                        onClick={() => navigate('/assess')}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    >
                        {t('result.newAssessment')}
                    </button>
                </div>
            </div>
        </div>
    );
}
