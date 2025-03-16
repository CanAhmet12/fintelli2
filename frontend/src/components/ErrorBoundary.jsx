import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { captureError } from '../services/errorTracking';
import monitoring from '../services/monitoring';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Hata izleme servislerine gönder
        captureError(error, {
            componentStack: errorInfo.componentStack,
            componentName: this.props.name || 'unknown'
        });

        // Monitoring metriklerini güncelle
        monitoring.recordError(error, this.props.name);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        this.props.onRetry?.();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        p: 3,
                        textAlign: 'center',
                        bgcolor: 'error.light',
                        borderRadius: 1,
                        color: 'error.contrastText'
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        <FormattedMessage id="error.title" />
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <FormattedMessage id="error.message" />
                    </Typography>

                    {this.props.showError && (
                        <Typography 
                            variant="caption" 
                            component="pre"
                            sx={{ 
                                mb: 2,
                                p: 1,
                                bgcolor: 'error.dark',
                                borderRadius: 0.5,
                                overflow: 'auto'
                            }}
                        >
                            {this.state.error?.toString()}
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleRetry}
                        sx={{ mt: 2 }}
                    >
                        <FormattedMessage id="error.retry" />
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 