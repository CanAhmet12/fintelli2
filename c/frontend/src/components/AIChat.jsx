import React, { useState, useRef, useEffect } from 'react';
import { 
    Box, 
    TextField, 
    IconButton, 
    Paper, 
    Typography,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const AIChat = ({ userId }) => {  // userId prop olarak alınıyor
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Önceki sohbet geçmişini yükle
        loadChatHistory();
    }, [userId]);

    const loadChatHistory = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/history/${userId}`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Sohbet geçmişi yüklenemedi:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !userId) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setIsTyping(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/chat/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: userMessage }),
            });

            if (!response.ok) {
                throw new Error('API yanıt vermedi');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { text: data.response, sender: 'ai' }]);
        } catch (error) {
            console.error('Mesaj gönderilemedi:', error);
            setMessages(prev => [...prev, { 
                text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 
                sender: 'ai' 
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // ... return kısmı aynı kalacak
};

export default AIChat; 