import { Analytics } from '@segment/analytics-next';
import { captureError } from './errorTracking';

class AnalyticsService {
    constructor() {
        this.analytics = new Analytics({
            writeKey: process.env.REACT_APP_SEGMENT_KEY
        });
        
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        this.analytics.on('error', (error) => {
            captureError(error, {
                context: 'Analytics',
                error: error.message
            });
        });
    }

    // Kullanıcı kimliği tanımlama
    identify(userId, traits = {}) {
        try {
            this.analytics.identify(userId, {
                ...traits,
                lastIdentified: new Date().toISOString()
            });
        } catch (error) {
            captureError(error, {
                context: 'Analytics.identify',
                userId,
                traits
            });
        }
    }

    // Sayfa görüntüleme
    trackPageView(pageName, properties = {}) {
        try {
            this.analytics.page(pageName, {
                url: window.location.href,
                path: window.location.pathname,
                referrer: document.referrer,
                title: document.title,
                ...properties
            });
        } catch (error) {
            captureError(error, {
                context: 'Analytics.trackPageView',
                pageName,
                properties
            });
        }
    }

    // Kullanıcı etkileşimleri
    trackEvent(eventName, properties = {}) {
        try {
            this.analytics.track(eventName, {
                timestamp: new Date().toISOString(),
                ...properties
            });
        } catch (error) {
            captureError(error, {
                context: 'Analytics.trackEvent',
                eventName,
                properties
            });
        }
    }

    // Chat etkileşimleri
    trackChatInteraction(action, properties = {}) {
        this.trackEvent(`chat_${action}`, {
            ...properties,
            timestamp: new Date().toISOString()
        });
    }

    // Performans metrikleri
    trackPerformance(metricName, value, tags = {}) {
        this.trackEvent('performance_metric', {
            metric: metricName,
            value,
            ...tags
        });
    }

    // Kullanıcı oturumu
    trackSession(action, properties = {}) {
        this.trackEvent(`session_${action}`, {
            ...properties,
            timestamp: new Date().toISOString()
        });
    }

    // Hata izleme
    trackError(error, context = {}) {
        this.trackEvent('error_occurred', {
            error: error.message,
            errorType: error.name,
            stackTrace: error.stack,
            ...context
        });
    }

    // Dönüşüm izleme
    trackConversion(type, properties = {}) {
        this.trackEvent(`conversion_${type}`, {
            ...properties,
            timestamp: new Date().toISOString()
        });
    }
}

export default new AnalyticsService(); 