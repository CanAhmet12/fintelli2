import { Metrics, Counter, Histogram } from '@opentelemetry/metrics';
import { trace, context } from '@opentelemetry/api';
import { store } from '../store';
import analytics from './analytics';

class MonitoringService {
    constructor() {
        this.metrics = new Metrics({
            serviceName: 'fintelli-frontend',
            serviceVersion: process.env.REACT_APP_VERSION
        });
        
        this.setupMetrics();
        this.setupErrorHandling();
        this.setupPerformanceObserver();
    }

    setupMetrics() {
        // Performance metrics
        this.renderTime = new Histogram('component_render_time', {
            description: 'Component render duration in milliseconds'
        });

        this.apiLatency = new Histogram('api_latency', {
            description: 'API request latency in milliseconds',
            boundaries: [100, 200, 500, 1000, 2000]
        });

        this.messageProcessing = new Histogram('message_processing_time', {
            description: 'Message processing duration in milliseconds'
        });

        // Business metrics
        this.messageCounter = new Counter('messages_sent', {
            description: 'Number of messages sent'
        });

        this.errorCounter = new Counter('errors', {
            description: 'Number of errors by type'
        });

        this.userInteractions = new Counter('user_interactions', {
            description: 'User interaction events'
        });

        // Resource metrics
        this.memoryUsage = new Histogram('memory_usage', {
            description: 'Memory usage in MB'
        });

        this.longTasks = new Histogram('long_tasks', {
            description: 'Tasks taking more than 50ms'
        });
    }

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.recordError('uncaught', {
                message: event.error?.message,
                stack: event.error?.stack,
                source: event.filename
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.recordError('unhandledRejection', {
                message: event.reason?.message,
                stack: event.reason?.stack
            });
        });
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Sayfa yükleme metrikleri
            const pageObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'navigation') {
                        this.pageLoadTime.observe({
                            page: window.location.pathname
                        }, entry.duration / 1000);

                        // Google Analytics'e de gönder
                        analytics.timing('Page Load', 'total', entry.duration);
                    }
                });
            });

            pageObserver.observe({ entryTypes: ['navigation'] });

            // Web Vitals metrikleri
            const vitalsObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    const metric = entry.name;
                    const value = entry.value;

                    // Prometheus metriği olarak kaydet
                    this.recordWebVital(metric, value);

                    // Google Analytics'e gönder
                    analytics.timing('Web Vitals', metric, value);
                });
            });

            vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        }
    }

    recordWebVital(metric, value) {
        const gauge = new Gauge({
            name: `web_vital_${metric.toLowerCase()}`,
            help: `Web Vital metric: ${metric}`
        });
        gauge.set(value);
    }

    // Performance monitoring
    recordRenderTime(componentName, duration) {
        const attributes = {
            component: componentName,
            environment: process.env.NODE_ENV
        };

        this.renderTime.record(duration, attributes);
        
        // Uzun render'ları logla
        if (duration > 16) {
            console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
        }
    }

    recordApiCall(operation, duration, metadata = {}) {
        const attributes = {
            operation,
            ...metadata
        };

        this.apiLatency.record(duration, attributes);
        
        // Yavaş API çağrılarını izle
        if (duration > 1000) {
            this.recordLongTask('api_call', duration, {
                operation,
                ...metadata
            });
        }
    }

    recordMessageProcessing(duration, metadata = {}) {
        this.messageProcessing.record(duration, {
            userId: store.getState().auth.userId,
            ...metadata
        });
    }

    // Business monitoring
    recordUserInteraction(action, component, metadata = {}) {
        this.userInteractions.add(1, {
            action,
            component,
            userId: store.getState().auth.userId,
            ...metadata
        });
    }

    recordChatResponse(duration, metadata = {}) {
        const attributes = {
            userId: store.getState().auth.userId,
            ...metadata
        };

        this.messageCounter.add(1, attributes);
        this.messageProcessing.record(duration, attributes);
    }

    // Error monitoring
    recordError(type, details = {}) {
        const attributes = {
            type,
            userId: store.getState().auth.userId,
            environment: process.env.NODE_ENV,
            ...details
        };

        this.errorCounter.add(1, attributes);
        
        // Critical hataları alert et
        if (this.isCriticalError(type, details)) {
            this.alertCriticalError(type, details);
        }
    }

    recordApiError(operation, error) {
        this.recordError('api_error', {
            operation,
            status: error.status,
            message: error.message
        });
    }

    // Resource monitoring
    recordMemoryUsage(used, total) {
        this.memoryUsage.record(used, {
            total,
            timestamp: Date.now()
        });
    }

    recordLongTask(type, duration, metadata = {}) {
        this.longTasks.record(duration, {
            type,
            ...metadata
        });
    }

    // Utility methods
    isCriticalError(type, details) {
        return (
            type === 'uncaught' ||
            type === 'unhandledRejection' ||
            details.status === 500 ||
            this.errorCounter.getValue({ type }) > 10
        );
    }

    alertCriticalError(type, details) {
        // Alert servisi entegrasyonu
        console.error('[CRITICAL ERROR]', {
            type,
            details,
            timestamp: new Date().toISOString()
        });
    }

    // Tracing
    async withSpan(name, fn) {
        const span = trace.getTracer('default').startSpan(name);
        
        try {
            return await context.with(
                trace.setSpan(context.active(), span),
                fn
            );
        } finally {
            span.end();
        }
    }
}

export default new MonitoringService(); 