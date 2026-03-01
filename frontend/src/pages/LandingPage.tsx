// frontend/src/pages/LandingPage.tsx
// Landing page with language selection, description, and "Get Started" button
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center animate-fade-in">
                {/* Logo Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-700 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-primary-200">
                    <span className="text-4xl">🩺</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
                    {t('landing.welcome')}
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                    {t('landing.description')}
                </p>

                {/* Get Started Button */}
                <button
                    id="get-started-btn"
                    onClick={() => navigate('/assess')}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                    {t('landing.getStarted')}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>

            {/* How It Works */}
            <div className="mt-16 animate-slide-up">
                <h3 className="text-xl font-bold text-slate-800 text-center mb-8">{t('landing.howItWorks')}</h3>

                <div className="grid sm:grid-cols-3 gap-6">
                    {[
                        { step: '1', icon: '💬', text: t('landing.step1'), color: 'from-blue-500 to-blue-600' },
                        { step: '2', icon: '📋', text: t('landing.step2'), color: 'from-indigo-500 to-indigo-600' },
                        { step: '3', icon: '✅', text: t('landing.step3'), color: 'from-emerald-500 to-emerald-600' },
                    ].map((item) => (
                        <div key={item.step} className="glass-card p-6 text-center hover:scale-[1.02] transition-transform">
                            <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md`}>
                                <span className="text-2xl">{item.icon}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-400 mb-2">Step {item.step}</div>
                            <p className="text-slate-700 font-medium">{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Not a Doctor Notice */}
            <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-sm text-amber-800 font-medium">
                    ℹ️ {t('landing.notADoctor')}
                </p>
            </div>
        </div>
    );
}
