import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIChat from '../AIChat';
import api from '../../../services/api';

// API mock
jest.mock('../../../services/api');

describe('AIChat Component', () => {
    const mockUserId = '123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders chat interface', () => {
        render(<AIChat userId={mockUserId} />);
        
        expect(screen.getByText(/fintelli ai asistan/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/mesajınızı yazın/i)).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('sends message and shows response', async () => {
        const mockResponse = {
            data: {
                response: 'Merhaba! Size nasıl yardımcı olabilirim?'
            }
        };
        api.post.mockResolvedValueOnce(mockResponse);

        render(<AIChat userId={mockUserId} />);
        
        const input = screen.getByPlaceholderText(/mesajınızı yazın/i);
        fireEvent.change(input, { target: { value: 'Merhaba' } });
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('Merhaba')).toBeInTheDocument();
            expect(screen.getByText(mockResponse.data.response)).toBeInTheDocument();
        });

        expect(api.post).toHaveBeenCalledWith(`/chat/${mockUserId}`, {
            text: 'Merhaba'
        });
    });

    test('shows error message on API failure', async () => {
        api.post.mockRejectedValueOnce(new Error('API Error'));

        render(<AIChat userId={mockUserId} />);
        
        const input = screen.getByPlaceholderText(/mesajınızı yazın/i);
        fireEvent.change(input, { target: { value: 'Test message' } });
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText(/bir hata oluştu/i)).toBeInTheDocument();
        });
    });

    test('validates message length', async () => {
        render(<AIChat userId={mockUserId} />);
        
        const input = screen.getByPlaceholderText(/mesajınızı yazın/i);
        fireEvent.change(input, { target: { value: 'a' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByText(/mesaj çok kısa/i)).toBeInTheDocument();
        });
    });
}); 