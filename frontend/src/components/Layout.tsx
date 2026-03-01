// frontend/src/components/Layout.tsx
// Shared layout with header (logo, language selector, help) and footer (disclaimer)
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage, Language } from '../context/LanguageContext';

interface LayoutProps {
    children: React.ReactNode;
}

const languageLabels: Record<Language, string> = {
    en: 'English',
    hi: 'हिन्दी',
    ta: 'தமிழ்',
};

export default function Layout({ children }: LayoutProps) {
    const { t, language, setLanguage } = useLanguage();
    const location = useLocation();
    const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname === '/login';

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Logo & Name */}
                    <Link to="/" className="flex items-center gap-2 group" id="nav-home">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <span className="text-white text-lg font-bold">S</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 leading-tight">{t('app.name')}</h1>
                            <p className="text-[10px] text-slate-500 leading-tight">{t('app.tagline')}</p>
                        </div>
                    </Link>

                    {/* Right side: Language selector + Help/Emergency */}
                    <div className="flex items-center gap-3">
                        {/* Language Selector */}
                        {!isDashboard && (
                            <select
                                id="language-selector"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                className="text-sm bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-200 cursor-pointer focus:ring-2 focus:ring-primary-500"
                                aria-label={t('common.language')}
                            >
                                {Object.entries(languageLabels).map(([code, label]) => (
                                    <option key={code} value={code}>{label}</option>
                                ))}
                            </select>
                        )}

                        {/* Emergency Banner */}
                        <a
                            href="tel:112"
                            className="hidden sm:flex items-center gap-1 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200 hover:bg-red-100 transition-colors font-medium"
                            id="emergency-link"
                        >
                            <span>🚨</span>
                            <span>{t('common.emergency')}</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer with Disclaimer */}
            <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 py-4 mt-auto">
                <div className="max-w-4xl mx-auto px-4">
                    <p className="text-xs text-slate-500 text-center leading-relaxed" role="alert">
                        {t('common.disclaimer')}
                    </p>
                </div>
            </footer>
        </div>
    );
}
