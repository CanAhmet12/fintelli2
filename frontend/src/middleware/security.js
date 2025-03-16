import { isProduction } from '../utils/environment';
import DOMPurify from 'dompurify';
import { rateLimit } from './rateLimit';
import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import { captureError } from '../services/errorTracking';

// CSP politikası
const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://www.google-analytics.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': [
        "'self'",
        'https://api.fintelli.app',
        'https://sentry.io',
        'https://www.google-analytics.com'
    ],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"]
};

// Security headers
export const securityHeaders = {
    'Content-Security-Policy': Object.entries(cspDirectives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; '),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// CSRF token yönetimi
export const generateCSRFToken = () => {
    const token = crypto.getRandomValues(new Uint8Array(32))
        .reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
    
    localStorage.setItem('csrf-token', token);
    return token;
};

// API istekleri için güvenlik interceptor'ı
export const securityInterceptor = (config) => {
    // CSRF token ekle
    config.headers['X-CSRF-Token'] = localStorage.getItem('csrf-token');
    
    // Production'da sadece HTTPS
    if (isProduction && !config.url.startsWith('https://')) {
        throw new Error('HTTPS required in production');
    }
    
    return config;
};

// Input sanitization
export const sanitizeInput = (input) => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
};

// Sensitive data temizleme
export const clearSensitiveData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
};

class SecurityService {
    constructor() {
        // XSS koruması için DOMPurify konfigürasyonu
        this.sanitizer = DOMPurify;
        this.sanitizer.setConfig({
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            ALLOWED_ATTR: ['href', 'target', 'rel'],
            ALLOW_DATA_ATTR: false,
            ADD_ATTR: ['target="_blank"', 'rel="noopener noreferrer"']
        });

        // CSRF token yönetimi
        this.setupCSRFProtection();
    }

    setupCSRFProtection() {
        // CSRF token'ı meta tag'den al
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            // Tüm API isteklerine CSRF token'ı ekle
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        } else {
            console.error('CSRF token not found');
        }
    }

    sanitizeInput(input, options = {}) {
        try {
            if (typeof input !== 'string') {
                return input;
            }

            // XSS koruması
            let sanitized = this.sanitizer.sanitize(input, {
                ...this.sanitizer.config,
                ...options
            });

            // SQL injection koruması için ek kontroller
            sanitized = this.preventSQLInjection(sanitized);

            // Maksimum uzunluk kontrolü
            if (options.maxLength && sanitized.length > options.maxLength) {
                sanitized = sanitized.slice(0, options.maxLength);
            }

            return sanitized;
        } catch (error) {
            captureError(error, {
                context: 'SecurityService.sanitizeInput',
                input: typeof input,
                options
            });
            return '';
        }
    }

    preventSQLInjection(input) {
        // SQL injection için riskli karakterleri ve kalıpları temizle
        return input.replace(/['";\\%]/g, '');
    }

    validateInput(input, rules = {}) {
        const errors = [];

        try {
            // Boş input kontrolü
            if (rules.required && !input?.trim()) {
                errors.push('Input is required');
            }

            // Minimum uzunluk kontrolü
            if (rules.minLength && input.length < rules.minLength) {
                errors.push(`Minimum length is ${rules.minLength}`);
            }

            // Maksimum uzunluk kontrolü
            if (rules.maxLength && input.length > rules.maxLength) {
                errors.push(`Maximum length is ${rules.maxLength}`);
            }

            // Pattern kontrolü
            if (rules.pattern && !rules.pattern.test(input)) {
                errors.push('Input format is invalid');
            }

            // Özel validasyon kuralları
            if (rules.validate) {
                const customError = rules.validate(input);
                if (customError) {
                    errors.push(customError);
                }
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        } catch (error) {
            captureError(error, {
                context: 'SecurityService.validateInput',
                input: typeof input,
                rules
            });
            return {
                isValid: false,
                errors: ['Validation error occurred']
            };
        }
    }

    @rateLimit({
        windowMs: 1000, // 1 saniye
        maxRequests: 1
    })
    async processUserInput(input, options = {}) {
        try {
            // Input validasyonu
            const validation = this.validateInput(input, {
                required: true,
                minLength: 2,
                maxLength: 500,
                ...options.validation
            });

            if (!validation.isValid) {
                throw new Error(validation.errors[0]);
            }

            // Input sanitization
            const sanitized = this.sanitizeInput(input, options.sanitize);

            return {
                success: true,
                data: sanitized
            };
        } catch (error) {
            store.dispatch(addNotification({
                type: 'error',
                message: error.message
            }));

            return {
                success: false,
                error: error.message
            };
        }
    }

    validateToken(token) {
        try {
            // Token format kontrolü
            if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
                return false;
            }

            // Token süresi kontrolü
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp < Date.now() / 1000) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }
}

export default new SecurityService(); 