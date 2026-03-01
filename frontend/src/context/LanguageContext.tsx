// frontend/src/context/LanguageContext.tsx
// Global language context — provides i18n translation function to all components
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import ta from '../i18n/ta.json';

type Language = 'en' | 'hi' | 'ta';

// Translation dictionary mapped by language code
const translations: Record<Language, Record<string, any>> = { en, hi, ta };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string; // Translation function: t('landing.welcome')
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Resolve a dot-separated key path from a nested JSON object.
 * e.g., t('landing.welcome') => translations[lang].landing.welcome
 */
function getNestedValue(obj: Record<string, any>, path: string): string {
    const keys = path.split('.');
    let current: any = obj;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return path; // Return key itself if translation missing
        }
    }
    return typeof current === 'string' ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const t = useCallback(
        (key: string): string => {
            // Try current language first, fallback to English
            const value = getNestedValue(translations[language], key);
            if (value !== key) return value;
            return getNestedValue(translations['en'], key);
        },
        [language]
    );

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Hook to access translation function and language state.
 * Usage: const { t, language, setLanguage } = useLanguage();
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export type { Language };
