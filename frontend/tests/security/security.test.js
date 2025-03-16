import { render, fireEvent, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../src/store';
import App from '../../src/App';
import { XSS_PAYLOADS, SQL_INJECTION_PAYLOADS } from './security-payloads';

describe('Security Tests', () => {
    const history = createMemoryHistory();

    const renderApp = () => {
        return render(
            <Provider store={store}>
                <Router history={history}>
                    <App />
                </Router>
            </Provider>
        );
    };

    describe('XSS Prevention', () => {
        test.each(XSS_PAYLOADS)('should sanitize XSS payload: %s', async (payload) => {
            const { getByRole, queryByText } = renderApp();

            // Chat input'una XSS payload'ı gönder
            const input = getByRole('textbox');
            fireEvent.change(input, { target: { value: payload } });
            fireEvent.click(getByRole('button', { name: /send/i }));

            // Payload'ın execute edilmediğini kontrol et
            await waitFor(() => {
                const message = queryByText(payload);
                expect(message).toBeInTheDocument();
                expect(message.innerHTML).not.toBe(payload);
            });
        });
    });

    describe('CSRF Protection', () => {
        test('should include CSRF token in requests', async () => {
            global.fetch = jest.fn();
            
            const { getByRole } = renderApp();
            const input = getByRole('textbox');
            
            fireEvent.change(input, { target: { value: 'test message' } });
            fireEvent.click(getByRole('button', { name: /send/i }));

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-CSRF-Token': expect.any(String)
                    })
                })
            );
        });
    });

    describe('Authentication & Authorization', () => {
        test('should not allow access to protected routes without token', () => {
            history.push('/dashboard');
            const { queryByText } = renderApp();
            
            expect(queryByText('Portföy Performansı')).not.toBeInTheDocument();
            expect(history.location.pathname).toBe('/login');
        });

        test('should clear sensitive data on logout', async () => {
            const { getByTestId } = renderApp();
            
            // Önce login ol
            await loginUser();
            
            // Logout yap
            fireEvent.click(getByTestId('logout-button'));
            
            // Token ve kullanıcı bilgilerinin temizlendiğini kontrol et
            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('userId')).toBeNull();
            expect(sessionStorage.getItem('user')).toBeNull();
        });
    });

    describe('Input Validation', () => {
        test.each(SQL_INJECTION_PAYLOADS)(
            'should validate against SQL injection: %s',
            async (payload) => {
                const { getByRole, queryByText } = renderApp();
                
                const input = getByRole('textbox');
                fireEvent.change(input, { target: { value: payload } });
                
                // SQL injection karakterlerinin engellendiğini kontrol et
                expect(input.value).not.toContain('--');
                expect(input.value).not.toContain(';');
                expect(queryByText(/error/i)).not.toBeInTheDocument();
            }
        );
    });

    describe('Content Security', () => {
        test('should have proper CSP headers', () => {
            const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            expect(meta).toBeInTheDocument();
            expect(meta.content).toContain("default-src 'self'");
        });
    });
}); 