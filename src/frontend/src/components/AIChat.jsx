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

const AIChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

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

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
                Fintelli AI Asistan
            </Typography>

            {/* Mesaj Listesi */}
            <Paper 
                sx={{ 
                    flex: 1, 
                    mb: 2, 
                    overflow: 'auto',
                    bgcolor: 'background.default'
                }}
            >
                <List>
                    {messages.map((message, index) => (
                        <ListItem 
                            key={index}
                            sx={{
                                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <Paper
                                sx={{
                                    p: 1,
                                    maxWidth: '70%',
                                    bgcolor: message.sender === 'user' ? 'primary.light' : 'background.paper'
                                }}
                            >
                                <ListItemText 
                                    primary={message.text}
                                    sx={{
                                        color: message.sender === 'user' ? 'white' : 'text.primary'
                                    }}
                                />
                            </Paper>
                        </ListItem>
                    ))}
                    {isTyping && (
                        <ListItem>
                            <Paper sx={{ p: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Fintelli yazıyor...
                                </Typography>
                            </Paper>
                        </ListItem>
                    )}
                    <div ref={messagesEndRef} />
                </List>
            </Paper>

            {/* Mesaj Giriş Alanı */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Mesajınızı yazın..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <IconButton 
                    color="primary" 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                >
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default AIChat; 