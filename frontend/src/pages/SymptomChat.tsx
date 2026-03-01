// frontend/src/pages/SymptomChat.tsx
// Chat-style symptom intake + guided question flow
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../services/api';

interface ChatMessage {
    role: 'system' | 'user';
    content: string;
    type?: 'text' | 'question';
}

interface QuestionData {
    index: number;
    id: string;
    text: string;
    type: string;
    options: { value: string; label: string }[];
}

export default function SymptomChat() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // State
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'system', content: t('symptom.welcome'), type: 'text' },
    ]);
    const [complaint, setComplaint] = useState('');
    const [ageRange, setAgeRange] = useState('adult');
    const [gender, setGender] = useState('prefer_not_to_say');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [loading, setLoading] = useState(false);
    const [phase, setPhase] = useState<'input' | 'questions' | 'complete'>('input');
    const [error, setError] = useState('');

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentQuestion]);

    // Submit initial complaint
    async function handleSubmitComplaint(e: React.FormEvent) {
        e.preventDefault();
        if (!complaint.trim() || complaint.trim().length < 5) return;

        setError('');
        setLoading(true);

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: complaint, type: 'text' }]);

        try {
            const response = await api.startTriage({
                primaryComplaint: complaint.trim(),
                ageRange,
                gender,
                language,
            });

            if (response.isComplete) {
                // Emergency or unsupported — navigate to result immediately
                if (response.unsupported) {
                    setMessages(prev => [...prev, { role: 'system', content: response.message, type: 'text' }]);
                    setPhase('complete');
                } else {
                    // Emergency detected — go to result page
                    navigate(`/result/${response.sessionId}`, { state: { triageResult: response.triageResult } });
                }
            } else {
                // Question flow started
                setSessionId(response.sessionId);
                setTotalQuestions(response.totalQuestions);
                setCurrentQuestion(response.currentQuestion);
                setPhase('questions');

                setMessages(prev => [
                    ...prev,
                    { role: 'system', content: `📋 ${response.categoryName} — ${t('landing.step2')}`, type: 'text' },
                ]);
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || t('common.error');
            setError(msg);
            setMessages(prev => [...prev, { role: 'system', content: `❌ ${msg}`, type: 'text' }]);
        } finally {
            setLoading(false);
        }
    }

    // Answer a follow-up question
    async function handleAnswer(answerValue: string, answerLabel: string) {
        if (!sessionId || !currentQuestion) return;

        setError('');
        setLoading(true);

        // Add user answer as message
        setMessages(prev => [...prev, { role: 'user', content: answerLabel, type: 'text' }]);
        setCurrentQuestion(null);

        try {
            const response = await api.answerQuestion({
                sessionId,
                questionId: currentQuestion.id,
                answer: answerValue,
            });

            if (response.isComplete) {
                // Triage complete — navigate to result
                navigate(`/result/${sessionId}`, { state: { triageResult: response.triageResult } });
            } else {
                // More questions
                setCurrentQuestion(response.currentQuestion);
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || t('common.error');
            setError(msg);
            setMessages(prev => [...prev, { role: 'system', content: `❌ ${msg}`, type: 'text' }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="glass-card overflow-hidden flex flex-col" style={{ minHeight: '70vh' }}>
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`chat-bubble-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-br-md'
                                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {/* Current Question Display */}
                    {currentQuestion && !loading && (
                        <div className="chat-bubble-enter">
                            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                                <p className="text-sm font-medium text-slate-800 mb-3">{currentQuestion.text}</p>
                                <div className="space-y-2">
                                    {currentQuestion.options.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleAnswer(option.value, option.label)}
                                            className="w-full text-left text-sm bg-white hover:bg-primary-50 border border-slate-200 hover:border-primary-300 rounded-xl px-4 py-2.5 transition-all hover:shadow-sm active:scale-[0.98]"
                                            id={`option-${option.value}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                {/* Progress indicator */}
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                        <div
                                            className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                                            style={{ width: `${((currentQuestion.index + 1) / totalQuestions) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500">{currentQuestion.index + 1}/{totalQuestions}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span>{phase === 'input' ? t('symptom.analyzing') : t('symptom.answering')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input Area (only shown during input phase) */}
                {phase === 'input' && (
                    <form onSubmit={handleSubmitComplaint} className="border-t border-slate-200 p-4">
                        {/* Demographics (collapsible) */}
                        <div className="flex gap-3 mb-3">
                            <select
                                value={ageRange}
                                onChange={(e) => setAgeRange(e.target.value)}
                                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 flex-1"
                                id="age-range-select"
                                aria-label={t('symptom.ageRange')}
                            >
                                <option value="child">{t('symptom.child')}</option>
                                <option value="adult">{t('symptom.adult')}</option>
                                <option value="older_adult">{t('symptom.olderAdult')}</option>
                            </select>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 flex-1"
                                id="gender-select"
                                aria-label={t('symptom.gender')}
                            >
                                <option value="male">{t('symptom.male')}</option>
                                <option value="female">{t('symptom.female')}</option>
                                <option value="prefer_not_to_say">{t('symptom.other')}</option>
                            </select>
                        </div>

                        {/* Symptom input */}
                        <div className="flex gap-2">
                            <textarea
                                id="symptom-input"
                                value={complaint}
                                onChange={(e) => setComplaint(e.target.value)}
                                placeholder={t('symptom.placeholder')}
                                className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50 min-h-[48px] max-h-[120px]"
                                rows={2}
                                maxLength={512}
                                required
                                disabled={loading}
                                aria-label="Describe your symptoms"
                            />
                            <button
                                type="submit"
                                disabled={loading || complaint.trim().length < 5}
                                className="bg-primary-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all self-end"
                                id="submit-symptom-btn"
                            >
                                {t('symptom.submit')}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </form>
                )}
            </div>
        </div>
    );
}
