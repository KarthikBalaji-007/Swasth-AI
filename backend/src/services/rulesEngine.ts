// backend/src/services/rulesEngine.ts
// Core triage rules engine — drives ALL triage decisions independent of AI/LLM
// This is the key differentiator: consistent, reproducible, safety-biased outcomes

import triageRules from '../config/triage-rules.json';

// Type definitions for the rules config
interface QuestionOption {
    value: string;
    label: { [lang: string]: string };
    score: number;
}

interface Question {
    id: string;
    text: { [lang: string]: string };
    type: string;
    options: QuestionOption[];
}

interface Category {
    name: { [lang: string]: string };
    keywords: string[];
    questions: Question[];
    thresholds: { green: number; yellow: number };
}

interface TriageResult {
    riskBand: 'GREEN' | 'YELLOW' | 'RED';
    reasonCodes: string[];
    summary: string;
    recommendedAction: 'SELF_CARE' | 'NON_URGENT_CONSULT' | 'URGENT_CARE';
}

interface AnswerData {
    questionId: string;
    answer: string;
    score: number;
}

const rules = triageRules as {
    emergencyKeywords: string[];
    categories: { [key: string]: Category };
};

/**
 * Check if the complaint text contains emergency keywords.
 * Emergency keywords trigger an immediate RED band — no further questions needed.
 */
export function detectEmergency(text: string): boolean {
    const lowerText = text.toLowerCase();
    return rules.emergencyKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Categorize a complaint into one of the supported symptom groups
 * using keyword matching. This is the PRIMARY categorization method.
 * AI-based categorization is used as a fallback enhancer, not the primary driver.
 */
export function categorizeComplaint(text: string): string | null {
    const lowerText = text.toLowerCase();

    // Score each category based on keyword matches
    let bestCategory: string | null = null;
    let bestScore = 0;

    for (const [categoryKey, category] of Object.entries(rules.categories)) {
        let matchScore = 0;
        for (const keyword of category.keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                matchScore += keyword.split(' ').length; // Multi-word keywords score higher
            }
        }
        if (matchScore > bestScore) {
            bestScore = matchScore;
            bestCategory = categoryKey;
        }
    }

    return bestCategory;
}

/**
 * Get the question flow for a specific symptom category.
 * Returns the array of question objects from the rules config.
 */
export function getQuestionFlow(category: string): Question[] | null {
    const cat = rules.categories[category];
    if (!cat) return null;
    return cat.questions;
}

/**
 * Get a specific question by index from a category's flow.
 */
export function getQuestion(category: string, index: number): Question | null {
    const questions = getQuestionFlow(category);
    if (!questions || index >= questions.length) return null;
    return questions[index];
}

/**
 * Get total number of questions for a category.
 */
export function getQuestionCount(category: string): number {
    const questions = getQuestionFlow(category);
    return questions ? questions.length : 0;
}

/**
 * Get category display name in the specified language.
 */
export function getCategoryName(category: string, language: string = 'en'): string {
    const cat = rules.categories[category];
    if (!cat) return 'Unknown';
    return cat.name[language] || cat.name['en'] || 'Unknown';
}

/**
 * Evaluate completed answers and compute the triage risk band.
 * Uses score-sum thresholds defined in rules config.
 * Safety bias: conservative — ties go to the higher risk band.
 */
export function evaluate(
    category: string,
    answers: AnswerData[],
    primaryComplaint: string,
    language: string = 'en'
): TriageResult {
    const cat = rules.categories[category];

    if (!cat) {
        // Unknown category — conservative default to YELLOW
        return {
            riskBand: 'YELLOW',
            reasonCodes: ['UNKNOWN_CATEGORY'],
            summary: `User reported: ${primaryComplaint}`,
            recommendedAction: 'NON_URGENT_CONSULT'
        };
    }

    // Calculate total score from all answers
    const totalScore = answers.reduce((sum, a) => sum + a.score, 0);

    // Identify high-score answers that contributed to the outcome
    const significantAnswers = answers.filter(a => a.score >= 3);
    const reasonCodes: string[] = [];

    if (significantAnswers.length > 0) {
        reasonCodes.push(...significantAnswers.map(a => `HIGH_SCORE_${a.questionId}`));
    }

    // Determine risk band based on thresholds (safety-biased)
    let riskBand: 'GREEN' | 'YELLOW' | 'RED';
    let recommendedAction: 'SELF_CARE' | 'NON_URGENT_CONSULT' | 'URGENT_CARE';

    if (totalScore <= cat.thresholds.green) {
        riskBand = 'GREEN';
        recommendedAction = 'SELF_CARE';
        reasonCodes.push('SCORE_WITHIN_GREEN');
    } else if (totalScore <= cat.thresholds.yellow) {
        riskBand = 'YELLOW';
        recommendedAction = 'NON_URGENT_CONSULT';
        reasonCodes.push('SCORE_WITHIN_YELLOW');
    } else {
        riskBand = 'RED';
        recommendedAction = 'URGENT_CARE';
        reasonCodes.push('SCORE_ABOVE_YELLOW');
    }

    // Check for individual critical answers that auto-escalate
    // Any single answer with score >= 4 escalates to at least YELLOW
    const hasCriticalAnswer = answers.some(a => a.score >= 4);
    if (hasCriticalAnswer && riskBand === 'GREEN') {
        riskBand = 'YELLOW';
        recommendedAction = 'NON_URGENT_CONSULT';
        reasonCodes.push('CRITICAL_ANSWER_ESCALATION');
    }

    // Any single answer with score >= 5 escalates to RED
    const hasEmergencyAnswer = answers.some(a => a.score >= 5);
    if (hasEmergencyAnswer && riskBand !== 'RED') {
        riskBand = 'RED';
        recommendedAction = 'URGENT_CARE';
        reasonCodes.push('EMERGENCY_ANSWER_ESCALATION');
    }

    // Build symptom summary
    const categoryName = getCategoryName(category, language);
    const summary = `${categoryName}: ${primaryComplaint}. Total assessment score: ${totalScore}/${cat.thresholds.yellow + 5}.`;

    return {
        riskBand,
        reasonCodes,
        summary,
        recommendedAction
    };
}

/**
 * Get all available category keys for API response.
 */
export function getAvailableCategories(): string[] {
    return Object.keys(rules.categories);
}

/**
 * Validate that a given answer value exists in the question options.
 */
export function validateAnswer(category: string, questionId: string, answerValue: string): QuestionOption | null {
    const questions = getQuestionFlow(category);
    if (!questions) return null;

    const question = questions.find(q => q.id === questionId);
    if (!question) return null;

    const option = question.options.find(o => o.value === answerValue);
    return option || null;
}
