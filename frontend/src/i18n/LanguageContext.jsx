import React, { createContext, useState, useContext } from 'react';
import { IntlProvider } from 'react-intl';
import tr from './locales/tr';
import en from './locales/en';

const locales = { tr, en };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState(localStorage.getItem('language') || 'tr');

    const switchLanguage = (lang) => {
        setLocale(lang);
        localStorage.setItem('language', lang);
    };

    return (
        <LanguageContext.Provider value={{ locale, switchLanguage }}>
            <IntlProvider messages={locales[locale]} locale={locale}>
                {children}
            </IntlProvider>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}; 