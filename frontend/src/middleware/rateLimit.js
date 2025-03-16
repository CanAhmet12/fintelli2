class RateLimiter {
    constructor() {
        this.requests = new Map();
    }

    checkLimit(key, { windowMs, maxRequests }) {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Eski istekleri temizle
        this.cleanup(windowStart);
        
        // İstek geçmişini al veya oluştur
        const requestHistory = this.requests.get(key) || [];
        
        // Pencere içindeki istek sayısını kontrol et
        const requestsInWindow = requestHistory.filter(time => time > windowStart);
        
        if (requestsInWindow.length >= maxRequests) {
            return false;
        }
        
        // Yeni isteği kaydet
        requestHistory.push(now);
        this.requests.set(key, requestHistory);
        
        return true;
    }

    cleanup(windowStart) {
        for (const [key, times] of this.requests.entries()) {
            const validTimes = times.filter(time => time > windowStart);
            if (validTimes.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, validTimes);
            }
        }
    }
}

const limiter = new RateLimiter();

export function rateLimit(options = {}) {
    const {
        windowMs = 60000, // Varsayılan: 1 dakika
        maxRequests = 30, // Varsayılan: 30 istek
        keyGenerator = () => 'global' // Varsayılan: global key
    } = options;

    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function(...args) {
            const key = keyGenerator.call(this, ...args);
            
            if (!limiter.checkLimit(key, { windowMs, maxRequests })) {
                throw new Error('Rate limit exceeded');
            }
            
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
} 