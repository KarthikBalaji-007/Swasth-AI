// frontend/src/pages/Dashboard.tsx
// Reviewer dashboard with case list, filters, and stats overview
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../services/api';

interface CaseItem {
    sessionId: string;
    primaryComplaint: string;
    category: string;
    riskBand: 'YELLOW' | 'RED';
    recommendedAction: string;
    status: string;
    createdAt: string;
    ageRange: string;
    summary: string;
}

interface Stats {
    totalSessions: number;
    completedSessions: number;
    riskDistribution: { green: number; yellow: number; red: number };
    reviewedCount: number;
    pendingReview: number;
}

export default function Dashboard() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterRisk, setFilterRisk] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Check auth on mount
    useEffect(() => {
        const token = localStorage.getItem('swasthai_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [filterRisk, filterStatus]);

    async function fetchData() {
        setLoading(true);
        try {
            const [casesData, statsData] = await Promise.all([
                api.getCases({
                    riskBand: filterRisk || undefined,
                    status: filterStatus || undefined,
                }),
                api.getStats(),
            ]);
            setCases(casesData.cases);
            setStats(statsData);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('swasthai_token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem('swasthai_token');
        localStorage.removeItem('swasthai_user');
        navigate('/login');
    }

    const userName = (() => {
        try {
            const user = JSON.parse(localStorage.getItem('swasthai_user') || '{}');
            return user.displayName || 'Reviewer';
        } catch { return 'Reviewer'; }
    })();

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('dashboard.title')}</h2>
                    <p className="text-sm text-slate-500">Welcome, {userName}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-colors"
                    id="logout-btn"
                >
                    {t('dashboard.logout')}
                </button>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <StatCard label={t('dashboard.totalSessions')} value={stats.totalSessions} color="text-primary-600" bg="bg-primary-50" />
                    <StatCard label={t('dashboard.pendingReview')} value={stats.pendingReview} color="text-amber-600" bg="bg-amber-50" />
                    <StatCard label="🟡 Yellow" value={stats.riskDistribution.yellow} color="text-amber-600" bg="bg-amber-50" />
                    <StatCard label="🔴 Red" value={stats.riskDistribution.red} color="text-red-600" bg="bg-red-50" />
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2"
                    id="filter-risk"
                >
                    <option value="">{t('dashboard.riskBand')}: {t('dashboard.all')}</option>
                    <option value="YELLOW">🟡 Yellow</option>
                    <option value="RED">🔴 Red</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2"
                    id="filter-status"
                >
                    <option value="">{t('dashboard.status')}: {t('dashboard.all')}</option>
                    <option value="NEW">{t('dashboard.new')}</option>
                    <option value="REVIEWED">{t('dashboard.reviewed')}</option>
                </select>
            </div>

            {/* Cases Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
                ) : cases.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">{t('dashboard.noData')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('dashboard.time')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('dashboard.riskBand')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('dashboard.complaint')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('dashboard.status')}</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('dashboard.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((c) => (
                                    <tr key={c.sessionId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            {new Date(c.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${c.riskBand === 'RED'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {c.riskBand === 'RED' ? '🔴' : '🟡'} {c.riskBand}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{c.primaryComplaint}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${c.status === 'REVIEWED'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => navigate(`/dashboard/case/${c.sessionId}`)}
                                                className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                                                id={`view-case-${c.sessionId.slice(0, 8)}`}
                                            >
                                                {t('dashboard.viewDetails')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Stat card component
function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
    return (
        <div className={`${bg} rounded-2xl p-4 border border-white/50`}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
    );
}
