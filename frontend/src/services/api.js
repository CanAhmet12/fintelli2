import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { securityInterceptor, securityHeaders, generateCSRFToken } from '../middleware/security';
import { captureError } from './errorTracking';
import monitoring from './monitoring';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...securityHeaders
    },
    withCredentials: true // CORS için
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Security checks
        const secureConfig = securityInterceptor(config);
        
        // Rate limiting
        const now = Date.now();
        const lastRequest = localStorage.getItem('lastRequest');
        if (lastRequest && now - parseInt(lastRequest) < 100) {
            throw new Error('Too many requests');
        }
        localStorage.setItem('lastRequest', now.toString());
        
        // Auth token
        const token = localStorage.getItem('token');
        if (token) {
            secureConfig.headers.Authorization = `Bearer ${token}`;
        }
        
        return secureConfig;
    },
    (error) => {
        captureError(error);
        monitoring.recordError(error, 'API Request');
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Validate response
        if (!response.data) {
            throw new Error('Invalid response');
        }
        
        // Yeni CSRF token
        const newToken = response.headers['x-csrf-token'];
        if (newToken) {
            localStorage.setItem('csrf-token', newToken);
        }
        
        return response;
    },
    (error) => {
        // Handle specific errors
        if (error.response?.status === 401) {
            clearSensitiveData();
            window.location.href = '/login';
        }
        
        captureError(error);
        monitoring.recordError(error, 'API Response');
        return Promise.reject(error);
    }
);

// API başlatma
export const initializeAPI = () => {
    generateCSRFToken();
};

export default api; 