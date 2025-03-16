import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../store/slices/authSlice';
import notificationReducer from '../../../store/slices/notificationSlice';
import Login from '../Login';
import api from '../../../services/api';

// API mock
jest.mock('../../../services/api');

const renderWithProviders = (component) => {
    const store = configureStore({
        reducer: {
            auth: authReducer,
            notification: notificationReducer
        }
    });

    return render(
        <Provider store={store}>
            <BrowserRouter>
                {component}
            </BrowserRouter>
        </Provider>
    );
};

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders login form', () => {
        renderWithProviders(<Login />);
        
        expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument();
    });

    test('shows validation errors', async () => {
        renderWithProviders(<Login />);
        
        const submitButton = screen.getByRole('button', { name: /giriş yap/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/e-posta adresi gereklidir/i)).toBeInTheDocument();
            expect(screen.getByText(/şifre gereklidir/i)).toBeInTheDocument();
        });
    });

    test('handles successful login', async () => {
        const mockResponse = {
            data: {
                user: { id: 1, email: 'test@example.com' },
                token: 'fake-token'
            }
        };
        api.post.mockResolvedValueOnce(mockResponse);

        renderWithProviders(<Login />);
        
        fireEvent.change(screen.getByLabelText(/e-posta/i), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/şifre/i), {
            target: { value: 'password123' }
        });

        fireEvent.click(screen.getByRole('button', { name: /giriş yap/i }));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password123'
            });
        });
    });

    test('handles login error', async () => {
        const errorMessage = 'Geçersiz kimlik bilgileri';
        api.post.mockRejectedValueOnce({
            response: { data: { message: errorMessage } }
        });

        renderWithProviders(<Login />);
        
        fireEvent.change(screen.getByLabelText(/e-posta/i), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/şifre/i), {
            target: { value: 'wrong-password' }
        });

        fireEvent.click(screen.getByRole('button', { name: /giriş yap/i }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });
}); 