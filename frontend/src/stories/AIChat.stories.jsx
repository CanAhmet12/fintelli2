import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import AIChat from '../components/AIChat';
import { store } from '../store';
import tr from '../i18n/locales/tr';

export default {
    title: 'Components/AIChat',
    component: AIChat,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `
                    AI Chat bileşeni, kullanıcıların yapay zeka asistanı ile etkileşime girmesini sağlar.
                    Mesajlaşma arayüzü, giriş validasyonu ve erişilebilirlik özellikleri içerir.
                `
            }
        }
    },
    decorators: [
        (Story) => (
            <Provider store={store}>
                <BrowserRouter>
                    <IntlProvider messages={tr} locale="tr">
                        <div style={{ width: '400px', height: '600px' }}>
                            <Story />
                        </div>
                    </IntlProvider>
                </BrowserRouter>
            </Provider>
        )
    ]
};

// Temel kullanım
export const Default = {
    args: {
        userId: 'test-user'
    }
};

// Yükleniyor durumu
export const Loading = {
    args: {
        userId: 'test-user',
        initialIsTyping: true
    }
};

// Hata durumu
export const WithError = {
    args: {
        userId: 'test-user',
        initialMessages: [
            { text: 'Test message', sender: 'user' },
            { text: 'Üzgünüm, bir hata oluştu', sender: 'ai' }
        ]
    }
};

// Örnek konuşma
export const WithConversation = {
    args: {
        userId: 'test-user',
        initialMessages: [
            { text: 'Merhaba, nasıl yardımcı olabilirim?', sender: 'ai' },
            { text: 'Portföyümü analiz edebilir misin?', sender: 'user' },
            { text: 'Tabii ki! Portföyünüzü inceliyorum...', sender: 'ai' }
        ]
    }
}; 