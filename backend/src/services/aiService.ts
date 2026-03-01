// backend/src/services/aiService.ts
// AI service wrapper for Google Gemini — used ONLY for:
// 1. Helping categorize free-text symptoms (with keyword fallback)
// 2. Generating friendly explanation text AFTER rules engine decides triage
// NEVER used for triage decisions themselves

import { GoogleGenerativeAI } from '@google/generative-ai';
import promptTemplates from '../config/prompt-templates.json';
import disclaimers from '../config/disclaimers.json';

// Lazy-init Gemini client (only when API key is available)
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
    if (!genAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

/**
 * Use AI to help categorize a free-text symptom description.
 * This is a HELPER — the rules engine keyword matching is the primary method.
 * Returns category key string or null if AI is unavailable/fails.
 */
export async function categorizeWithAI(complaint: string): Promise<string | null> {
    try {
        const ai = getGenAI();
        if (!ai) return null; // AI not available — caller should use keyword fallback

        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = promptTemplates.categorizationTemplate.replace('{complaint}', complaint);

        const result = await model.generateContent(prompt);
        const response = result.response.text().trim().toLowerCase();

        // Validate the AI returned one of our known categories
        const validCategories = ['fever_cough', 'chest_discomfort', 'diarrhoea_vomiting', 'headache', 'unsupported'];
        if (validCategories.includes(response)) {
            return response === 'unsupported' ? null : response;
        }

        return null; // AI returned unexpected value — fall back to keyword matching
    } catch (error) {
        console.error('⚠️ AI categorization failed (using keyword fallback):', error);
        return null;
    }
}

/**
 * Generate user-friendly explanation text for the triage outcome.
 * Uses Gemini API with constrained prompts (no diagnosis, no prescriptions).
 * Falls back to static messages if AI is unavailable.
 */
export async function generateExplanation(params: {
    summary: string;
    riskBand: 'GREEN' | 'YELLOW' | 'RED';
    recommendedAction: string;
    language: string;
}): Promise<string> {
    const { summary, riskBand, recommendedAction, language } = params;
    const lang = language as keyof typeof disclaimers.fallbackMessages.GREEN;

    try {
        const ai = getGenAI();
        if (!ai) {
            // No AI available — return static fallback message
            return getFallbackMessage(riskBand, lang);
        }

        const model = ai.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: promptTemplates.systemPrompt
        });

        // Map language code to language name for the prompt
        const languageName = promptTemplates.languageNames[language as keyof typeof promptTemplates.languageNames] || 'English';

        const prompt = promptTemplates.explanationTemplate
            .replace('{language_name}', languageName)
            .replace('{risk_band}', riskBand)
            .replace('{summary}', summary)
            .replace('{recommended_action}', recommendedAction);

        const result = await model.generateContent(prompt);
        const aiText = result.response.text().trim();

        // Sanity check: ensure AI didn't return something too short or empty
        if (aiText.length < 20) {
            return getFallbackMessage(riskBand, lang);
        }

        return aiText;
    } catch (error) {
        console.error('⚠️ AI explanation generation failed (using fallback):', error);
        return getFallbackMessage(riskBand, lang);
    }
}

/**
 * Get static fallback message for when AI is unavailable.
 * Ensures the app works fully even without an API key.
 */
function getFallbackMessage(riskBand: 'GREEN' | 'YELLOW' | 'RED', language: string): string {
    const fallbacks = disclaimers.fallbackMessages as Record<string, Record<string, string>>;
    const bandMessages = fallbacks[riskBand];
    if (bandMessages && bandMessages[language]) {
        return bandMessages[language];
    }
    // Absolute fallback — English GREEN message
    return fallbacks['GREEN']['en'];
}

/**
 * Get safety-net recommendations for the specified language.
 */
export function getSafetyNetAdvice(language: string): string[] {
    const lang = language as keyof typeof disclaimers.safetyNet;
    return disclaimers.safetyNet[lang] || disclaimers.safetyNet['en'];
}

/**
 * Get the main disclaimer text for the specified language.
 */
export function getDisclaimer(language: string): string {
    const lang = language as keyof typeof disclaimers.mainDisclaimer;
    return disclaimers.mainDisclaimer[lang] || disclaimers.mainDisclaimer['en'];
}

/**
 * Get emergency message for the specified language.
 */
export function getEmergencyMessage(language: string): string {
    const lang = language as keyof typeof disclaimers.emergencyMessage;
    return disclaimers.emergencyMessage[lang] || disclaimers.emergencyMessage['en'];
}
