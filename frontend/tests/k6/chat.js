import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '1m', target: 50 },  // Yavaşça 50 kullanıcıya çık
        { duration: '3m', target: 50 },  // 3 dakika boyunca yükü tut
        { duration: '1m', target: 100 }, // 100 kullanıcıya çık
        { duration: '3m', target: 100 }, // 3 dakika boyunca yükü tut
        { duration: '1m', target: 0 },   // Yavaşça sonlandır
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // %95 isteklerin 500ms altında olmalı
        errors: ['rate<0.1'],            // %10'dan az hata olmalı
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export function setup() {
    // Test kullanıcısı oluştur
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
        email: 'loadtest@example.com',
        password: 'testpass123'
    });

    check(loginRes, {
        'login successful': (r) => r.status === 200,
    });

    return {
        token: loginRes.json('token'),
        userId: loginRes.json('user.id')
    };
}

export default function(data) {
    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    // AI Chat isteği
    const chatPayload = {
        text: 'Merhaba, bu bir load test mesajıdır.'
    };

    const chatRes = http.post(
        `${BASE_URL}/api/chat/${data.userId}`,
        JSON.stringify(chatPayload),
        params
    );

    check(chatRes, {
        'chat response successful': (r) => r.status === 200,
        'chat response time OK': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);
}

export function teardown(data) {
    // Cleanup işlemleri
    http.del(`${BASE_URL}/api/test/cleanup/${data.userId}`, null, {
        headers: { 'Authorization': `Bearer ${data.token}` },
    });
} 