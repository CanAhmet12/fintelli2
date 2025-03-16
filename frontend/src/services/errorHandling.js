import { captureError } from './errorTracking';
import monitoring from './monitoring';
import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import { setError } from '../store/slices/chatSlice';

class ErrorHandler {
    constructor() {
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Yakalanmamış Promise hataları
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'unhandledRejection',
                context: 'global'
            });
        });

        // Genel JavaScript hataları
        window.addEventListener('error', (event) => {
            this.handleError(event.error, {
                type: 'uncaughtError',
                context: 'global',
                source: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });
    }

    handleError(error, context = {}) {
        const errorInfo = this.getErrorInfo(error, context);
        
        // Hata izleme
        captureError(error, errorInfo);
        
        // Metrik güncelleme
        monitoring.recordError(errorInfo.type, errorInfo);
        
        // Kullanıcı bildirimi
        this.notifyUser(errorInfo);
        
        // Loglama
        if (process.env.NODE_ENV === 'development') {
            console.error('[ErrorHandler]', errorInfo);
        }

        return errorInfo;
    }

    getErrorInfo(error, context) {
        return {
            message: error.message || 'An unknown error occurred',
            type: error.name || 'Error',
            stack: error.stack,
            timestamp: Date.now(),
            context: {
                ...context,
                url: window.location.href,
                userAgent: navigator.userAgent
            },
            metadata: this.getErrorMetadata(error)
        };
    }

    getErrorMetadata(error) {
        const metadata = {};

        // API hataları için
        if (error.response) {
            metadata.status = error.response.status;
            metadata.statusText = error.response.statusText;
            metadata.data = error.response.data;
        }

        // Network hataları için
        if (error.request) {
            metadata.request = {
                method: error.config?.method,
                url: error.config?.url,
                data: error.config?.data
            };
        }

        // Validation hataları için
        if (error.validationErrors) {
            metadata.validation = error.validationErrors;
        }

        return metadata;
    }

    notifyUser(errorInfo) {
        const message = this.getUserFriendlyMessage(errorInfo);
        
        store.dispatch(addNotification({
            type: 'error',
            message,
            duration: this.getNotificationDuration(errorInfo),
            action: this.getErrorAction(errorInfo)
        }));

        // Component-specific error state
        if (errorInfo.context?.component) {
            store.dispatch(setError(message));
        }
    }

    getUserFriendlyMessage(errorInfo) {
        const status = errorInfo.metadata?.status;
        
        // HTTP status code'a göre mesajlar
        if (status) {
            switch (status) {
                case 400:
                    return 'The request was invalid. Please check your input.';
                case 401:
                    return 'Your session has expired. Please login again.';
                case 403:
                    return 'You don\'t have permission to perform this action.';
                case 404:
                    return 'The requested resource could not be found.';
                case 429:
                    return 'Too many requests. Please try again later.';
                case 500:
                    return 'An unexpected server error occurred. Please try again later.';
                default:
                    return 'An error occurred while processing your request.';
            }
        }

        // Validation hataları
        if (errorInfo.metadata?.validation) {
            return Object.values(errorInfo.metadata.validation)[0];
        }

        // Network hataları
        if (errorInfo.type === 'NetworkError') {
            return 'Unable to connect to the server. Please check your internet connection.';
        }

        // Genel hata mesajı
        return errorInfo.message || 'An unexpected error occurred.';
    }

    getNotificationDuration(errorInfo) {
        // Önem derecesine göre bildirim süresi
        switch (errorInfo.type) {
            case 'ValidationError':
                return 5000; // 5 seconds
            case 'NetworkError':
                return 8000; // 8 seconds
            case 'AuthError':
                return 10000; // 10 seconds
            default:
                return 6000; // 6 seconds
        }
    }

    getErrorAction(errorInfo) {
        // Hata tipine göre action butonu
        switch (errorInfo.type) {
            case 'AuthError':
                return {
                    label: 'Login',
                    handler: () => window.location.href = '/login'
                };
            case 'NetworkError':
                return {
                    label: 'Retry',
                    handler: () => window.location.reload()
                };
            default:
                return null;
        }
    }
}

export default new ErrorHandler(); 