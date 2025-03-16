import chatAPI from '../chat';
import api from '../base';
import { store } from '../../../store';
import { setError, setTyping } from '../../../store/slices/chatSlice';
import { addNotification } from '../../../store/slices/notificationSlice';
import { captureError } from '../../errorTracking';
import monitoring from '../../monitoring';

// Mock dependencies
jest.mock('../base');
jest.mock('../../../store');
jest.mock('../../errorTracking');
jest.mock('../../monitoring');

describe('ChatAPI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendMessage', () => {
        const mockParams = {
            userId: 'test-user',
            text: 'Test message',
            conversationId: 'test-conv'
        };

        it('sends message successfully', async () => {
            const mockResponse = { data: { response: 'AI response' } };
            api.post.mockResolvedValueOnce(mockResponse);
            
            const result = await chatAPI.sendMessage(mockParams);
            
            expect(api.post).toHaveBeenCalledWith(
                `/chat/${mockParams.userId}`,
                expect.objectContaining({
                    text: mockParams.text,
                    conversationId: mockParams.conversationId
                })
            );
            
            expect(monitoring.recordApiCall).toHaveBeenCalled();
            expect(result).toBe(mockResponse.data);
        });

        it('handles errors correctly', async () => {
            const error = new Error('API error');
            api.post.mockRejectedValueOnce(error);
            
            await expect(chatAPI.sendMessage(mockParams)).rejects.toThrow(error);
            
            expect(captureError).toHaveBeenCalledWith(error, expect.any(Object));
            expect(monitoring.recordApiError).toHaveBeenCalled();
            expect(store.dispatch).toHaveBeenCalledWith(setTyping(false));
            expect(store.dispatch).toHaveBeenCalledWith(setError(expect.any(String)));
        });
    });

    describe('getConversationHistory', () => {
        it('fetches history successfully', async () => {
            const mockResponse = { data: { messages: [] } };
            api.get.mockResolvedValueOnce(mockResponse);
            
            const result = await chatAPI.getConversationHistory('test-conv');
            
            expect(api.get).toHaveBeenCalledWith('/chat/conversations/test-conv');
            expect(monitoring.recordApiCall).toHaveBeenCalled();
            expect(result).toBe(mockResponse.data);
        });
    });

    describe('deleteConversation', () => {
        it('deletes conversation successfully', async () => {
            api.delete.mockResolvedValueOnce({});
            
            await chatAPI.deleteConversation('test-conv');
            
            expect(api.delete).toHaveBeenCalledWith('/chat/conversations/test-conv');
            expect(store.dispatch).toHaveBeenCalledWith(
                addNotification(expect.objectContaining({
                    type: 'success'
                }))
            );
        });
    });

    describe('error handling', () => {
        it('handles different HTTP status codes', () => {
            const testCases = [
                { status: 400, expected: 'Invalid request' },
                { status: 401, expected: 'Please login' },
                { status: 403, expected: 'permission' },
                { status: 404, expected: 'not found' },
                { status: 429, expected: 'Too many requests' },
                { status: 500, expected: 'Server error' }
            ];

            testCases.forEach(({ status, expected }) => {
                const error = { response: { status } };
                const message = chatAPI.getErrorMessage(error);
                expect(message).toContain(expected);
            });
        });

        it('handles network errors', () => {
            const error = { request: {} };
            const message = chatAPI.getErrorMessage(error);
            expect(message).toContain('Network error');
        });
    });
}); 