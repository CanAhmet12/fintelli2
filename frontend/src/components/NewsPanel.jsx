import React from 'react';
import { 
    Box, 
    Typography, 
    List, 
    ListItem, 
    ListItemText,
    Chip,
    CircularProgress,
    Divider,
    IconButton
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';

const NewsPanel = ({ news }) => {
    if (!news) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    const getSentimentIcon = (sentiment) => {
        switch (sentiment.toLowerCase()) {
            case 'positive':
                return <SentimentSatisfiedAltIcon color="success" />;
            case 'negative':
                return <SentimentVeryDissatisfiedIcon color="error" />;
            default:
                return <SentimentNeutralIcon color="action" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Finansal Haberler
            </Typography>
            
            <List>
                {news.map((item, index) => (
                    <React.Fragment key={index}>
                        <ListItem 
                            alignItems="flex-start"
                            sx={{ 
                                flexDirection: 'column',
                                py: 2
                            }}
                        >
                            <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(item.publishedAt)}
                                </Typography>
                                <Box sx={{ flex: 1 }} />
                                {item.symbols && item.symbols.map(symbol => (
                                    <Chip 
                                        key={symbol}
                                        label={symbol}
                                        size="small"
                                        sx={{ ml: 1 }}
                                    />
                                ))}
                            </Box>
                            
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" sx={{ flex: 1 }}>
                                            {item.title}
                                        </Typography>
                                        <IconButton 
                                            size="small" 
                                            href={item.url} 
                                            target="_blank"
                                            sx={{ ml: 1 }}
                                        >
                                            <OpenInNewIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            {getSentimentIcon(item.sentiment)}
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{ ml: 1 }}
                                            >
                                                Duygu Analizi: {item.sentiment}
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                        </ListItem>
                        {index < news.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default NewsPanel; 