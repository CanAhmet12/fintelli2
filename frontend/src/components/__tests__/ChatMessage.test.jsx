import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ChatMessage from '../ChatMessage';
import messages from '../../i18n/locales/tr';

describe('ChatMessage Component', () => {
    const renderMessage = (props) => {
        return render(
            <IntlProvider messages={messages} locale="tr">
                <ChatMessage {...props} />
            </IntlProvider>
        );
    };

    it('renders user message correctly', () => {
        const message = {
            text: 'Test user message',
            sender: 'user'
        };
        
        renderMessage({ 
            message,
            'aria-setsize': 10,
            'aria-posinset': 5
        });
        
        expect(screen.getByText(message.text)).toBeInTheDocument();
        expect(screen.getByRole('listitem')).toHaveAttribute('aria-setsize', '10');
        expect(screen.getByRole('listitem')).toHaveAttribute('aria-posinset', '5');
    });

    it('renders AI message correctly', () => {
        const message = {
            text: 'Test AI message',
            sender: 'ai'
        };
        
        renderMessage({ message });
        
        const messageElement = screen.getByText(message.text);
        expect(messageElement).toBeInTheDocument();
        expect(messageElement.closest('div')).toHaveStyle({
            marginRight: 'auto'
        });
    });

    it('applies correct styles based on sender', () => {
        const userMessage = {
            text: 'User message',
            sender: 'user'
        };
        
        const { rerender } = renderMessage({ message: userMessage });
        
        let messageBox = screen.getByText(userMessage.text).closest('div');
        expect(messageBox).toHaveStyle({
            backgroundColor: expect.stringContaining('primary.main')
        });
        
        const aiMessage = {
            text: 'AI message',
            sender: 'ai'
        };
        
        rerender(
            <IntlProvider messages={messages} locale="tr">
                <ChatMessage message={aiMessage} />
            </IntlProvider>
        );
        
        messageBox = screen.getByText(aiMessage.text).closest('div');
        expect(messageBox).toHaveStyle({
            backgroundColor: expect.stringContaining('grey.100')
        });
    });

    it('includes screen reader text', () => {
        const message = {
            text: 'Test message',
            sender: 'user'
        };
        
        renderMessage({ 
            message,
            'aria-setsize': 3,
            'aria-posinset': 2
        });
        
        // Screen reader only text
        expect(screen.getByText((content) => (
            content.includes('You: Test message')
        ))).toBeInTheDocument();
        
        expect(screen.getByText((content) => (
            content.includes('Message 2 of 3')
        ))).toBeInTheDocument();
    });

    it('memoizes correctly', () => {
        const message = {
            text: 'Test message',
            sender: 'user'
        };
        
        const { rerender } = renderMessage({ message });
        const initialInstance = screen.getByRole('listitem');
        
        // Rerender with same props
        rerender(
            <IntlProvider messages={messages} locale="tr">
                <ChatMessage message={message} />
            </IntlProvider>
        );
        
        expect(screen.getByRole('listitem')).toBe(initialInstance);
        
        // Rerender with different props
        rerender(
            <IntlProvider messages={messages} locale="tr">
                <ChatMessage 
                    message={{
                        ...message,
                        text: 'Different message'
                    }}
                />
            </IntlProvider>
        );
        
        expect(screen.getByRole('listitem')).not.toBe(initialInstance);
    });
}); 