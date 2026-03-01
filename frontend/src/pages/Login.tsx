// frontend/src/pages/Login.tsx
// Simple reviewer/admin login page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../services/api';

export default function Login() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!username.trim() || !password) return;

        setLoading(true);
        setError('');

        try {
            const data = await api.login(username.trim(), password);
            localStorage.setItem('swasthai_token', data.token);
            localStorage.setItem('swasthai_user', JSON.stringify(data.user));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.error'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="glass-card p-8 animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🔐</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('auth.login')}</h2>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="login-username" className="block text-sm font-medium text-slate-700 mb-1">
                            {t('auth.username')}
                        </label>
                        <input
                            id="login-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
                            required
                            autoComplete="username"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
                            {t('auth.password')}
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
                            required
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        id="login-submit-btn"
                        type="submit"
                        disabled={loading || !username.trim() || !password}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                    >
                        {loading ? t('auth.loggingIn') : t('auth.loginButton')}
                    </button>
                </form>

                {/* Demo credentials hint */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-700">
                        <strong>Demo Credentials:</strong><br />
                        Admin: admin / swasthya123<br />
                        Reviewer: reviewer / review123
                    </p>
                </div>
            </div>
        </div>
    );
}
