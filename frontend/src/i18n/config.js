import { createIntl, createIntlCache } from 'react-intl';
import { store } from '../store';
import { setLocale } from '../store/slices/i18nSlice';

// Supported locales
export const SUPPORTED_LOCALES = ['tr', 'en', 'de', 'fr', 'es'];
export const DEFAULT_LOCALE = 'tr';

// Create cache for better performance
const cache = createIntlCache();

class I18nService {
    constructor() {
        this.loadedMessages = new Map();
        this.currentLocale = DEFAULT_LOCALE;
        this.intl = null;
        this.setupListeners();
    }

    setupListeners() {
        // Browser dil değişikliğini izle
        window.addEventListener('languagechange', () => {
            this.setLocale(navigator.language.split('-')[0]);
        });
    }

    async loadMessages(locale) {
        if (this.loadedMessages.has(locale)) {
            return this.loadedMessages.get(locale);
        }

        try {
            const messages = await import(`./locales/${locale}.js`);
            this.loadedMessages.set(locale, messages.default);
            return messages.default;
        } catch (error) {
            console.warn(`Failed to load messages for locale: ${locale}`);
            return null;
        }
    }

    async setLocale(locale) {
        // Desteklenen dilleri kontrol et
        const normalizedLocale = SUPPORTED_LOCALES.includes(locale) 
            ? locale 
            : DEFAULT_LOCALE;

        // Mesajları yükle
        const messages = await this.loadMessages(normalizedLocale);
        if (!messages) return;

        // Intl instance'ı güncelle
        this.intl = createIntl({
            locale: normalizedLocale,
            messages,
            defaultLocale: DEFAULT_LOCALE,
            onError: (err) => {
                console.error('I18n Error:', err);
            }
        }, cache);

        this.currentLocale = normalizedLocale;
        
        // Redux store'u güncelle
        store.dispatch(setLocale(normalizedLocale));
        
        // Locale'i localStorage'a kaydet
        localStorage.setItem('preferred_locale', normalizedLocale);
        
        // HTML lang attribute'unu güncelle
        document.documentElement.lang = normalizedLocale;
        
        // RTL desteği
        document.dir = this.isRTL(normalizedLocale) ? 'rtl' : 'ltr';
    }

    formatMessage(id, values = {}) {
        if (!this.intl) {
            console.warn('Intl not initialized');
            return id;
        }
        return this.intl.formatMessage({ id }, values);
    }

    formatNumber(value, options = {}) {
        return this.intl.formatNumber(value, {
            ...options,
            style: options.style || 'decimal'
        });
    }

    formatDate(value, options = {}) {
        return this.intl.formatDate(value, {
            ...options,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    }

    isRTL(locale) {
        return ['ar', 'he', 'fa'].includes(locale);
    }

    getDirection() {
        return this.isRTL(this.currentLocale) ? 'rtl' : 'ltr';
    }
}

export default new I18nService(); 