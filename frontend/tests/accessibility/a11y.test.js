import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../src/store';
import App from '../../src/App';
import Dashboard from '../../src/components/Dashboard';
import AIChat from '../../src/components/AIChat';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
    const renderWithProviders = (component) => {
        return render(
            <Provider store={store}>
                <BrowserRouter>
                    {component}
                </BrowserRouter>
            </Provider>
        );
    };

    it('should have no accessibility violations in App', async () => {
        const { container } = renderWithProviders(<App />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in Dashboard', async () => {
        const { container } = renderWithProviders(<Dashboard />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in AIChat', async () => {
        const { container } = renderWithProviders(<AIChat userId="test-user" />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    describe('Keyboard Navigation', () => {
        it('should be able to navigate through chat interface with keyboard', () => {
            const { getByRole } = renderWithProviders(<AIChat userId="test-user" />);
            
            const input = getByRole('textbox');
            const sendButton = getByRole('button', { name: /send/i });
            
            // Tab order kontrolü
            expect(document.body).toHaveFocus();
            input.focus();
            expect(input).toHaveFocus();
            sendButton.focus();
            expect(sendButton).toHaveFocus();
        });

        it('should handle Enter key in chat input', () => {
            const { getByRole } = renderWithProviders(<AIChat userId="test-user" />);
            const input = getByRole('textbox');
            
            input.focus();
            fireEvent.change(input, { target: { value: 'test message' } });
            fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });
            
            expect(input.value).toBe('');
        });
    });

    describe('ARIA Labels', () => {
        it('should have proper ARIA labels for interactive elements', () => {
            const { getByRole } = renderWithProviders(<AIChat userId="test-user" />);
            
            expect(getByRole('textbox')).toHaveAttribute('aria-label', 'Chat message input');
            expect(getByRole('button', { name: /send/i })).toHaveAttribute('aria-label', 'Send message');
        });

        it('should announce AI responses to screen readers', async () => {
            const { getByRole, findByRole } = renderWithProviders(<AIChat userId="test-user" />);
            
            const input = getByRole('textbox');
            fireEvent.change(input, { target: { value: 'test message' } });
            fireEvent.click(getByRole('button', { name: /send/i }));
            
            const response = await findByRole('article', { name: /ai response/i });
            expect(response).toHaveAttribute('aria-live', 'polite');
        });
    });

    describe('Color Contrast', () => {
        it('should have sufficient color contrast', async () => {
            const { container } = renderWithProviders(<App />);
            const results = await axe(container, {
                rules: {
                    'color-contrast': { enabled: true }
                }
            });
            
            expect(results).toHaveNoViolations();
        });
    });

    describe('Screen Reader Support', () => {
        it('should have proper heading structure', () => {
            const { getAllByRole } = renderWithProviders(<Dashboard />);
            const headings = getAllByRole('heading');
            
            // Heading seviyelerinin doğru sırada olduğunu kontrol et
            headings.forEach((heading, index) => {
                if (index > 0) {
                    const prevLevel = parseInt(headings[index - 1].getAttribute('aria-level'));
                    const currentLevel = parseInt(heading.getAttribute('aria-level'));
                    expect(currentLevel - prevLevel).toBeLessThanOrEqual(1);
                }
            });
        });

        it('should have descriptive link text', () => {
            const { getAllByRole } = renderWithProviders(<Dashboard />);
            const links = getAllByRole('link');
            
            links.forEach(link => {
                expect(link).not.toHaveTextContent(/click here|more|read more/i);
            });
        });
    });
}); 