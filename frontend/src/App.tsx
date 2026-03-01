// frontend/src/App.tsx
// Main application with routing and language context
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import SymptomChat from './pages/SymptomChat';
import TriageResult from './pages/TriageResult';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';

export default function App() {
    return (
        <LanguageProvider>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/assess" element={<SymptomChat />} />
                        <Route path="/result/:sessionId" element={<TriageResult />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/dashboard/case/:sessionId" element={<CaseDetail />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </LanguageProvider>
    );
}
