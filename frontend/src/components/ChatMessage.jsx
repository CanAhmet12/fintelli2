import React, { memo, useMemo } from 'react';
import { ListItem, Box, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

const styles = {
    message: {
        maxWidth: '70%',
        padding: 2,
        borderRadius: 2,
        marginBottom: 1
    },
    user: {
        marginLeft: 'auto',
        bgcolor: 'primary.main',
        color: 'primary.contrastText'
    },
    ai: {
        marginRight: 'auto',
        bgcolor: 'grey.100'
    }
};

const MessageContent = memo(({ text }) => (
    <Typography variant="body1" component="div">
        {text}
    </Typography>
));

MessageContent.propTypes = {
    text: PropTypes.string.isRequired
};

const ChatMessage = ({ 
    message, 
    'aria-setsize': ariaSetsize, 
    'aria-posinset': ariaPosinset 
}) => {
    const intl = useIntl();
    const isUser = message.sender === 'user';

    const memoizedProps = useMemo(() => ({
        'aria-setsize': ariaSetsize,
        'aria-posinset': ariaPosinset
    }), [ariaSetsize, ariaPosinset]);

    return (
        <ListItem
            sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
            role="listitem"
            {...memoizedProps}
        >
            <Box
                sx={{
                    ...styles.message,
                    ...(isUser ? styles.user : styles.ai)
                }}
            >
                {/* Screen reader only sender indicator */}
                <Typography 
                    component="span" 
                    sx={{ position: 'absolute', left: -9999 }}
                >
                    {intl.formatMessage(
                        { id: `chat.aria.${isUser ? 'userMessage' : 'aiMessage'}` },
                        { message: message.text }
                    )}
                </Typography>

                {/* Actual message content */}
                <MessageContent text={message.text} />

                {/* Message position for screen readers */}
                <Typography 
                    component="span" 
                    sx={{ position: 'absolute', left: -9999 }}
                >
                    {intl.formatMessage(
                        { id: 'chat.aria.messageCount' },
                        { count: ariaSetsize, current: ariaPosinset }
                    )}
                </Typography>
            </Box>
        </ListItem>
    );
};

ChatMessage.propTypes = {
    message: PropTypes.shape({
        text: PropTypes.string.isRequired,
        sender: PropTypes.oneOf(['user', 'ai']).isRequired
    }).isRequired,
    'aria-setsize': PropTypes.number,
    'aria-posinset': PropTypes.number
};

export default memo(ChatMessage, (prevProps, nextProps) => {
    return (
        prevProps.message.text === nextProps.message.text &&
        prevProps.message.sender === nextProps.message.sender &&
        prevProps['aria-setsize'] === nextProps['aria-setsize'] &&
        prevProps['aria-posinset'] === nextProps['aria-posinset']
    );
}); 