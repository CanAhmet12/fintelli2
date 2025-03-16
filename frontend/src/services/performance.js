import { captureError } from './errorTracking';
import monitoring from './monitoring';

class PerformanceService {
    constructor() {
        this.measures = new Map();
        this.setupObservers();
    }

    setupObservers() {
        // Web Vitals izleme
        if ('PerformanceObserver' in window) {
            // LCP (Largest Contentful Paint)
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                monitoring.recordWebVital('LCP', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // FID (First Input Delay)
            const fidObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    monitoring.recordWebVital('FID', entry.duration);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // CLS (Cumulative Layout Shift)
            const clsObserver = new PerformanceObserver((list) => {
                let clsScore = 0;
                list.getEntries().forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsScore += entry.value;
                    }
                });
                monitoring.recordWebVital('CLS', clsScore);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

            // Long Tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.duration > 50) {
                        monitoring.recordLongTask(entry.duration, entry.name);
                    }
                });
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });

            // Resource Timing
            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
                        monitoring.recordApiTiming(entry.name, entry.duration);
                    }
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
        }
    }

    startMeasure(name, detail = {}) {
        try {
            const start = performance.now();
            this.measures.set(name, { start, detail });
        } catch (error) {
            captureError(error, { context: 'startMeasure', name });
        }
    }

    endMeasure(name) {
        try {
            const end = performance.now();
            const measure = this.measures.get(name);
            
            if (!measure) {
                throw new Error(`No measure found with name: ${name}`);
            }

            const duration = end - measure.start;
            this.measures.delete(name);

            monitoring.recordCustomTiming(name, duration, measure.detail);
            return duration;
        } catch (error) {
            captureError(error, { context: 'endMeasure', name });
            return 0;
        }
    }

    // Component render sürelerini ölç
    measureRender(componentName, startTime) {
        const duration = performance.now() - startTime;
        monitoring.recordRenderTime(componentName, duration);
        
        // Uzun render'ları logla
        if (duration > 16) { // 60fps için 16ms threshold
            console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
        }
    }

    // Memory kullanımını izle
    measureMemory() {
        if (performance.memory) {
            const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
            monitoring.recordMemoryUsage(usedJSHeapSize, totalJSHeapSize);
        }
    }

    // FPS ölçümü
    measureFPS() {
        let frame = 0;
        let lastTime = performance.now();

        const countFrames = () => {
            const now = performance.now();
            frame++;

            if (now >= lastTime + 1000) {
                const fps = (frame * 1000) / (now - lastTime);
                monitoring.recordFPS(fps);
                frame = 0;
                lastTime = now;
            }

            requestAnimationFrame(countFrames);
        };

        requestAnimationFrame(countFrames);
    }
}

export default new PerformanceService(); 