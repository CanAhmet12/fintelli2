import React, { useState, useRef, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useIntl } from 'react-intl';
import { 
    Box, 
    TextField, 
    IconButton, 
    Paper, 
    Typography,
    List,
    CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../services/api';
import analytics from '../services/analytics';
import { captureError } from '../services/errorTracking';
import performance from '../services/performance';
import monitoring from '../services/monitoring';
import PropTypes from 'prop-types';
import ErrorBoundary from './ErrorBoundary';
import { sanitizeInput } from '../middleware/security';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectActiveMessages,
    selectIsTyping,
    selectError,
    addMessage,
    setTyping,
    setError,
    clearError
} from '../store/slices/chatSlice';
import chatAPI from '../services/api/chat';
import errorHandler from '../services/errorHandling';
import { visuallyHidden } from '@mui/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'lodash';
import i18n from '../i18n/config';

/**
 * AI Chat bileşeni - Kullanıcı ve yapay zeka arasındaki mesajlaşma arayüzü
 * 
 * @component
 * @example
 * ```jsx
 * <AIChat userId="user123" />
 * ```
 * 
 * @param {Object} props - Bileşen props'ları
 * @param {string} props.userId - Aktif kullanıcının ID'si
 * @param {string} props.conversationId - Aktif konuşma için ID
 * @param {Array<Object>} [props.initialMessages=[]] - Başlangıç mesajları
 * @param {boolean} [props.initialIsTyping=false] - Başlangıç yazıyor durumu
 * 
 * @returns {JSX.Element} AI Chat arayüzü
 */

// Lazy load edilecek bileşenler
const ChatMessage = lazy(() => import('./ChatMessage'));
const TypingIndicator = lazy(() => import('./TypingIndicator'));

/**
 * Mesaj validasyon şeması
 * @constant {Object}
 */
const MessageSchema = Yup.object().shape({
    message: Yup.string()
        .min(2, 'Mesaj çok kısa')
        .max(500, 'Mesaj çok uzun')
        .required('Mesaj boş olamaz')
});

// Stil objelerini dışarı çıkar
const styles = {
    container: {
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column'
    },
    messageList: { 
        flex: 1, 
        mb: 2, 
        overflow: 'auto',
        bgcolor: 'background.default',
        p: 2
    },
    sendButton: {
        bgcolor: 'primary.main',
        color: 'white',
        '&:hover': {
            bgcolor: 'primary.dark'
        },
        '&.Mui-disabled': {
            bgcolor: 'grey.300',
            color: 'grey.500'
        }
    },
    textField: {
        '& .MuiOutlinedInput-root': {
            borderRadius: '20px'
        }
    }
};

/**
 * Ana AI Chat bileşeni
 */
const AIChat = ({ userId, conversationId, initialMessages = [], initialIsTyping = false }) => {
    const intl = useIntl();
    const dispatch = useDispatch();
    const messages = useSelector(selectActiveMessages);
    const isTyping = useSelector(selectIsTyping);
    const error = useSelector(selectError);
    const chatEndRef = useRef(null);

    // Virtualized message list için ref
    const parentRef = useRef(null);
    
    // Virtualization için rowVirtualizer
    const rowVirtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60, // Tahmini mesaj yüksekliği
        overscan: 5 // Extra render edilecek mesaj sayısı
    });

    const direction = i18n.getDirection();

    // Component render süresini ölç
    useEffect(() => {
        const startTime = performance.now();
        
        // User session başlangıcını kaydet
        monitoring.recordUserInteraction('session_start', 'AIChat', {
            userId,
            conversationId
        });
        
        return () => {
            const duration = performance.now() - startTime;
            monitoring.recordRenderTime('AIChat', duration);
            
            // Session süresini kaydet
            monitoring.recordUserInteraction('session_end', 'AIChat', {
                userId,
                conversationId,
                duration
            });
        };
    }, [userId, conversationId]);

    // Memory kullanımını periyodik olarak ölç
    useEffect(() => {
        const interval = setInterval(() => {
            if (performance.memory) {
                monitoring.recordMemoryUsage(
                    performance.memory.usedJSHeapSize,
                    performance.memory.totalJSHeapSize
                );
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    /**
     * Mesaj gönderme işleyicisi
     * 
     * @async
     * @param {Object} values - Form değerleri
     * @param {Object} formikHelpers - Formik yardımcı fonksiyonları
     * @returns {Promise<void>}
     */
    const handleSubmit = useCallback(async (values, { resetForm }) => {
        if (isTyping) return;

        const startTime = performance.now();
        monitoring.recordUserInteraction('send_message', 'AIChat', {
            messageLength: values.message.length
        });

        const userMessage = sanitizeInput(values.message);
        resetForm();
        
        dispatch(addMessage({
            conversationId,
            message: {
                text: userMessage,
                sender: 'user',
                timestamp: Date.now()
            }
        }));
        dispatch(setTyping(true));
        dispatch(clearError());

        try {
            // Rate limiting kontrolü
            const lastMessage = localStorage.getItem('lastMessageTime');
            const now = Date.now();
            if (lastMessage && now - parseInt(lastMessage) < 1000) {
                throw Object.assign(new Error('Please wait before sending another message'), {
                    type: 'ValidationError'
                });
            }
            localStorage.setItem('lastMessageTime', now.toString());
            
            const response = await monitoring.withSpan(
                'send_chat_message',
                () => chatAPI.sendMessage({
                    userId,
                    text: userMessage,
                    conversationId
                })
            );

            const duration = performance.now() - startTime;
            monitoring.recordChatResponse(duration, {
                messageLength: userMessage.length,
                responseLength: response.response.length
            });

            dispatch(addMessage({
                conversationId,
                message: {
                    text: sanitizeInput(response.response),
                    sender: 'ai',
                    timestamp: Date.now()
                }
            }));
        } catch (error) {
            monitoring.recordError('message_error', {
                messageLength: userMessage.length,
                errorType: error.type,
                errorMessage: error.message
            });
            
            errorHandler.handleError(error, {
                component: 'AIChat',
                action: 'sendMessage',
                data: {
                    userId,
                    messageLength: userMessage.length,
                    conversationId
                }
            });
        } finally {
            dispatch(setTyping(false));
        }
    }, [isTyping, userId, conversationId, dispatch]);

    // Scroll performansını ölç
    const scrollToBottom = useCallback(() => {
        performance.startMeasure('scroll');
        requestAnimationFrame(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            performance.endMeasure('scroll');
        });
    }, []);

    // Scroll effect'ini optimize et
    useEffect(() => {
        if (messages.length > 0) {
            requestAnimationFrame(scrollToBottom);
        }
    }, [messages, scrollToBottom]);

    // Memoize edilmiş formik instance
    const formik = useMemo(() => ({
        initialValues: { message: '' },
        validationSchema: MessageSchema,
        onSubmit: handleSubmit
    }), [handleSubmit]);

    // Debounced scroll handler
    const handleScroll = useCallback(
        debounce(() => {
            const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            
            if (isNearBottom) {
                scrollToBottom();
            }
        }, 100),
        []
    );

    // Intersection Observer ile lazy loading
    const lastMessageRef = useCallback(node => {
        if (node) {
            const observer = new IntersectionObserver(
                entries => {
                    if (entries[0].isIntersecting) {
                        // Load more messages if needed
                    }
                },
                { threshold: 0.5 }
            );
            observer.observe(node);
            return () => observer.disconnect();
        }
    }, []);

    return (
        <Box 
            sx={styles.container}
            role="region"
            aria-label={intl.formatMessage({ id: 'chat.aria.region' })}
            dir={direction}
        >
            {/* Screen reader only başlık */}
            <Typography 
                variant="h1" 
                sx={visuallyHidden}
            >
                {intl.formatMessage({ id: 'chat.aria.title' })}
            </Typography>

            <Typography 
                variant="h2" 
                component="h2" 
                gutterBottom
                aria-live="polite"
            >
                {intl.formatMessage({ id: 'chat.title' })}
            </Typography>

            <Paper 
                ref={parentRef}
                sx={{
                    ...styles.messageList,
                    direction
                }}
                onScroll={handleScroll}
                role="log"
                aria-live="polite"
                aria-label={intl.formatMessage({ id: 'chat.aria.messages' })}
                tabIndex={0}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative'
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map(virtualRow => {
                        const message = messages[virtualRow.index];
                        return (
                            <div
                                key={virtualRow.index}
                                ref={
                                    virtualRow.index === messages.length - 1 
                                        ? lastMessageRef 
                                        : undefined
                                }
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`
                                }}
                            >
                                <Suspense fallback={<MessageSkeleton />}>
                                    <ChatMessage 
                                        message={message}
                                        aria-setsize={messages.length}
                                        aria-posinset={virtualRow.index + 1}
                                    />
                                </Suspense>
                            </div>
                        );
                    })}
                </div>
            </Paper>

            {error && (
                <Typography 
                    color="error" 
                    variant="body2" 
                    sx={{ mb: 2 }}
                    role="alert"
                    aria-live="assertive"
                >
                    {error}
                </Typography>
            )}

            <form 
                onSubmit={formik.handleSubmit}
                aria-label={intl.formatMessage({ id: 'chat.aria.form' })}
                dir={direction}
            >
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        name="message"
                        id="chat-message-input"
                        aria-label={intl.formatMessage({ id: 'chat.aria.input' })}
                        placeholder={intl.formatMessage({ id: 'chat.placeholder' })}
                        value={formik.values.message}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.message && Boolean(formik.errors.message)}
                        helperText={
                            formik.touched.message && 
                            intl.formatMessage({ id: formik.errors.message })
                        }
                        size="small"
                        disabled={isTyping}
                        sx={{
                            ...styles.textField,
                            '& .MuiInputBase-root': {
                                direction: 'inherit'
                            }
                        }}
                        inputProps={{
                            'aria-invalid': Boolean(formik.errors.message),
                            maxLength: 500,
                            dir: 'auto'
                        }}
                    />
                    <IconButton 
                        type="submit"
                        color="primary"
                        disabled={!formik.values.message.trim() || isTyping}
                        aria-label={intl.formatMessage({ 
                            id: isTyping ? 'chat.aria.sending' : 'chat.aria.send' 
                        })}
                        sx={styles.sendButton}
                    >
                        {isTyping ? (
                            <CircularProgress size={24} />
                        ) : (
                            <SendIcon />
                        )}
                    </IconButton>
                </Box>
            </form>
        </Box>
    );
};

AIChat.propTypes = {
    /** Aktif kullanıcının ID'si */
    userId: PropTypes.string.isRequired,
    /** Aktif konuşma için ID */
    conversationId: PropTypes.string.isRequired,
    /** Başlangıç mesajları */
    initialMessages: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        sender: PropTypes.oneOf(['user', 'ai']).isRequired
    })),
    /** Başlangıç yazıyor durumu */
    initialIsTyping: PropTypes.bool
};

// Error boundary ile sarılmış bileşeni export et
export default memo((props) => (
    <ErrorBoundary name="AIChat" showError={process.env.NODE_ENV === 'development'}>
        <AIChat {...props} />
    </ErrorBoundary>
)); 