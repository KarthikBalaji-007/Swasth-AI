// frontend/src/services/api.ts
// API client for communicating with the SwasthyaPath backend
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach auth token if available (for dashboard routes)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('swasthya_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Triage API ---

export async function startTriage(data: {
    primaryComplaint: string;
    ageRange?: string;
    gender?: string;
    language?: string;
}) {
    const response = await api.post('/triage/start', data);
    return response.data;
}

export async function answerQuestion(data: {
    sessionId: string;
    questionId: string;
    answer: string;
}) {
    const response = await api.post('/triage/answer', data);
    return response.data;
}

// --- Auth API ---

export async function login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
}

// --- Dashboard API ---

export async function getCases(params?: {
    riskBand?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    const response = await api.get('/dashboard/cases', { params });
    return response.data;
}

export async function getCaseDetail(sessionId: string) {
    const response = await api.get(`/dashboard/cases/${sessionId}`);
    return response.data;
}

export async function reviewCase(sessionId: string, notes: string) {
    const response = await api.post(`/dashboard/cases/${sessionId}/review`, { notes });
    return response.data;
}

export async function getStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
}

export default api;
