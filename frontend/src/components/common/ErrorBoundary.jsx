import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Hata loglama servisi burada kullanılabilir
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        p: 3,
                        textAlign: 'center'
                    }}
                >
                    <ErrorOutlineIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Bir şeyler yanlış gitti
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Üzgünüz, bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={this.handleReset}
                        sx={{ mt: 2 }}
                    >
                        Sayfayı Yenile
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 