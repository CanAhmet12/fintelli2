import api from './base';
import { store } from '../../store';
import { setError, setTyping } from '../../store/slices/chatSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import { captureError } from '../errorTracking';
import monitoring from '../monitoring';

class ChatAPI {
    /**
     * Mesaj gönder
     * @param {Object} params - İstek parametreleri
     * @returns {Promise} API yanıtı
     */
    async sendMessage({ userId, text, conversationId }) {
        const startTime = performance.now();
        
        try {
            const response = await api.post(`/chat/${userId}`, {
                text,
                conversationId,
                timestamp: Date.now(),
                messageId: crypto.randomUUID(),
                clientInfo: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language,
                    userAgent: navigator.userAgent
                }
            });

            monitoring.recordApiCall('sendMessage', performance.now() - startTime);
            return response.data;
        } catch (error) {
            this.handleError(error, 'sendMessage');
            throw error;
        }
    }

    /**
     * Konuşma geçmişini getir
     * @param {string} conversationId - Konuşma ID'si
     * @returns {Promise} API yanıtı
     */
    async getConversationHistory(conversationId) {
        const startTime = performance.now();
        
        try {
            const response = await api.get(`/chat/conversations/${conversationId}`);
            monitoring.recordApiCall('getHistory', performance.now() - startTime);
            return response.data;
        } catch (error) {
            this.handleError(error, 'getHistory');
            throw error;
        }
    }

    /**
     * Konuşmayı sil
     * @param {string} conversationId - Konuşma ID'si
     * @returns {Promise} API yanıtı
     */
    async deleteConversation(conversationId) {
        const startTime = performance.now();
        
        try {
            await api.delete(`/chat/conversations/${conversationId}`);
            monitoring.recordApiCall('deleteConversation', performance.now() - startTime);
            
            store.dispatch(addNotification({
                type: 'success',
                message: 'Conversation deleted successfully'
            }));
        } catch (error) {
            this.handleError(error, 'deleteConversation');
            throw error;
        }
    }

    /**
     * API hatalarını yönet
     * @private
     */
    handleError(error, operation) {
        const errorInfo = {
            operation,
            status: error.response?.status,
            message: error.message,
            timestamp: Date.now()
        };

        // Hata izleme
        captureError(error, errorInfo);
        monitoring.recordApiError(operation, errorInfo);

        // Store'u güncelle
        store.dispatch(setTyping(false));
        store.dispatch(setError(this.getErrorMessage(error)));

        // Kullanıcıya bildirim
        store.dispatch(addNotification({
            type: 'error',
            message: this.getErrorMessage(error)
        }));
    }

    /**
     * Hata mesajını belirle
     * @private
     */
    getErrorMessage(error) {
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    return 'Invalid request. Please check your input.';
                case 401:
                    return 'Please login to continue.';
                case 403:
                    return 'You don\'t have permission for this action.';
                case 404:
                    return 'The requested resource was not found.';
                case 429:
                    return 'Too many requests. Please wait a moment.';
                case 500:
                    return 'Server error. Please try again later.';
                default:
                    return 'An unexpected error occurred.';
            }
        }
        
        if (error.request) {
            return 'Network error. Please check your connection.';
        }
        
        return error.message || 'An unknown error occurred.';
    }
}

export default new ChatAPI(); 