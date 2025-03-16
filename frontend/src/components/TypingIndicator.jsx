import React, { memo } from 'react';
import { ListItem, Paper, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

const styles = {
    paper: { 
        p: 1.5, 
        bgcolor: 'grey.100',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: 1
    },
    dot: {
        width: 6,
        height: 6,
        backgroundColor: 'grey.500',
        borderRadius: '50%',
        animation: 'typing 1s infinite ease-in-out',
        '&:nth-of-type(1)': {
            animationDelay: '0s'
        },
        '&:nth-of-type(2)': {
            animationDelay: '0.2s'
        },
        '&:nth-of-type(3)': {
            animationDelay: '0.4s'
        },
        '@keyframes typing': {
            '0%, 100%': {
                transform: 'translateY(0)'
            },
            '50%': {
                transform: 'translateY(-5px)'
            }
        }
    }
};

const TypingIndicator = () => {
    const intl = useIntl();

    return (
        <ListItem>
            <Paper sx={styles.paper}>
                <Typography variant="body2" color="text.secondary">
                    {intl.formatMessage({ id: 'chat.typing' })}
                </Typography>
                <div style={styles.dot} />
                <div style={styles.dot} />
                <div style={styles.dot} />
            </Paper>
        </ListItem>
    );
};

TypingIndicator.displayName = 'TypingIndicator';

export default memo(TypingIndicator); 