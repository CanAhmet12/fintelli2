import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../../store/slices/chatSlice';
import notificationReducer from '../../store/slices/notificationSlice';
import AIChat from '../AIChat';
import chatAPI from '../../services/api/chat';
import monitoring from '../../services/monitoring';
import errorHandler from '../../services/errorHandling';
import messages from '../../i18n/locales/tr';

// Mock services
jest.mock('../../services/api/chat');
jest.mock('../../services/monitoring');
jest.mock('../../services/errorHandling');

describe('AIChat Component', () => {
    let store;
    
    beforeEach(() => {
        store = configureStore({
            reducer: {
                chat: chatReducer,
                notifications: notificationReducer
            }
        });
        
        // Reset mocks
        jest.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <Provider store={store}>
                <IntlProvider messages={messages} locale="tr">
                    <AIChat 
                        userId="test-user"
                        conversationId="test-conv"
                        {...props}
                    />
                </IntlProvider>
            </Provider>
        );
    };

    describe('Rendering', () => {
        it('renders correctly', () => {
            renderComponent();
            
            expect(screen.getByRole('region')).toBeInTheDocument();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByRole('button')).toBeDisabled();
        });

        it('shows loading state correctly', () => {
            renderComponent({ initialIsTyping: true });
            
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
            expect(screen.getByText(messages['chat.typing'])).toBeInTheDocument();
        });
    });

    describe('Message Handling', () => {
        it('sends message successfully', async () => {
            const mockResponse = {
                response: 'Test AI response'
            };
            chatAPI.sendMessage.mockResolvedValueOnce(mockResponse);
            
            renderComponent();
            
            const input = screen.getByRole('textbox');
            const button = screen.getByRole('button');
            
            await userEvent.type(input, 'Test message');
            expect(button).toBeEnabled();
            
            fireEvent.click(button);
            
            expect(chatAPI.sendMessage).toHaveBeenCalledWith({
                userId: 'test-user',
                text: 'Test message',
                conversationId: 'test-conv'
            });
            
            await waitFor(() => {
                expect(screen.getByText('Test AI response')).toBeInTheDocument();
            });
            
            expect(monitoring.recordChatResponse).toHaveBeenCalled();
        });

        it('handles API errors correctly', async () => {
            const error = new Error('API Error');
            chatAPI.sendMessage.mockRejectedValueOnce(error);
            
            renderComponent();
            
            const input = screen.getByRole('textbox');
            await userEvent.type(input, 'Test message');
            fireEvent.click(screen.getByRole('button'));
            
            await waitFor(() => {
                expect(errorHandler.handleError).toHaveBeenCalledWith(
                    error,
                    expect.objectContaining({
                        component: 'AIChat',
                        action: 'sendMessage'
                    })
                );
            });
        });
    });

    describe('Validation', () => {
        it('validates input correctly', async () => {
            renderComponent();
            
            const input = screen.getByRole('textbox');
            const button = screen.getByRole('button');
            
            // Empty input
            await userEvent.type(input, ' ');
            expect(button).toBeDisabled();
            
            // Too short
            await userEvent.clear(input);
            await userEvent.type(input, 'a');
            fireEvent.blur(input);
            expect(await screen.findByText(messages['chat.validation.min'])).toBeInTheDocument();
            
            // Valid input
            await userEvent.clear(input);
            await userEvent.type(input, 'Valid message');
            expect(button).toBeEnabled();
        });

        it('handles rate limiting', async () => {
            renderComponent();
            
            const input = screen.getByRole('textbox');
            const button = screen.getByRole('button');
            
            await userEvent.type(input, 'First message');
            fireEvent.click(button);
            
            await userEvent.type(input, 'Second message');
            fireEvent.click(button);
            
            expect(await screen.findByText(messages['chat.rateLimit'])).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('maintains focus management', async () => {
            renderComponent();
            
            const input = screen.getByRole('textbox');
            await userEvent.type(input, 'Test message');
            fireEvent.click(screen.getByRole('button'));
            
            expect(document.activeElement).toBe(input);
        });

        it('announces status changes', async () => {
            renderComponent();
            
            const mockResponse = { response: 'Test response' };
            chatAPI.sendMessage.mockResolvedValueOnce(mockResponse);
            
            await userEvent.type(screen.getByRole('textbox'), 'Test message');
            fireEvent.click(screen.getByRole('button'));
            
            expect(await screen.findByText(messages['chat.typing'])).toHaveAttribute('aria-live', 'polite');
        });
    });

    describe('Performance', () => {
        it('maintains scroll position on new messages', async () => {
            const mockResponse = {
                response: 'Test response'
            };
            chatAPI.sendMessage.mockResolvedValue(mockResponse);
            
            renderComponent();
            
            const scrollIntoViewMock = jest.fn();
            window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
            
            const input = screen.getByRole('textbox');
            await userEvent.type(input, 'Test message');
            fireEvent.click(screen.getByRole('button'));
            
            await waitFor(() => {
                expect(scrollIntoViewMock).toHaveBeenCalled();
            });
        });
    });
}); 