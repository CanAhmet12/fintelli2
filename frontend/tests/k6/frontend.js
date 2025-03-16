import { chromium } from 'k6/experimental/browser';
import { check } from 'k6';

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
            vus: 1, // Aynı anda çalışacak sanal kullanıcı sayısı
            iterations: 5,
        },
    },
    thresholds: {
        browser_dom_content_loaded: ['p(95)<3000'], // DOMContentLoaded 3s altında olmalı
        browser_first_paint: ['p(95)<2000'],        // First Paint 2s altında olmalı
        browser_ttfb: ['p(95)<1000'],              // Time to First Byte 1s altında olmalı
    },
};

export default async function() {
    const browser = chromium.launch({ headless: true });
    const page = browser.newPage();

    try {
        // Login sayfası yükleme testi
        await page.goto('http://localhost:3000/login');
        check(page, {
            'login page loaded': () => page.locator('h1').textContent().includes('Fintelli'),
        });

        // Login işlemi
        await page.type('input[name="email"]', 'test@example.com');
        await page.type('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Dashboard yükleme testi
        check(page, {
            'dashboard loaded': () => page.url().includes('/dashboard'),
            'portfolio chart visible': () => page.locator('[data-testid="portfolio-chart"]').isVisible(),
            'chat component loaded': () => page.locator('[data-testid="ai-chat"]').isVisible(),
        });

        // Chat testi
        await page.type('input[name="message"]', 'Test message');
        await page.click('button[type="submit"]');
        
        check(page, {
            'message sent': () => page.locator('.MuiListItem-root').count() > 0,
            'response received': async () => {
                await page.waitForSelector('[data-testid="ai-response"]', { timeout: 5000 });
                return true;
            },
        });

    } finally {
        page.close();
        browser.close();
    }
} 