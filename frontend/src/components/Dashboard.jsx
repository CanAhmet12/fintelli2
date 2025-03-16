import React, { Suspense, memo } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';
import ErrorBoundary from './ErrorBoundary';

// Lazy load components
const PortfolioChart = React.lazy(() => import('./PortfolioChart'));
const MarketOverview = React.lazy(() => import('./MarketOverview'));
const NewsPanel = React.lazy(() => import('./NewsPanel'));
const AIChat = React.lazy(() => import('./AIChat'));

// Loading component for widgets
const WidgetLoader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <CircularProgress />
    </Box>
);

const Dashboard = () => {
    const intl = useIntl();
    const userId = localStorage.getItem('userId');

    if (!userId) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">
                    {intl.formatMessage({ id: 'dashboard.login_required' })}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Grid container spacing={3}>
                {/* Portföy Özeti */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>
                            {intl.formatMessage({ id: 'dashboard.portfolio' })}
                        </Typography>
                        <Suspense fallback={<WidgetLoader />}>
                            <PortfolioChart />
                        </Suspense>
                    </Paper>
                </Grid>

                {/* AI Chatbot */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Suspense fallback={<WidgetLoader />}>
                            <AIChat userId={userId} />
                        </Suspense>
                    </Paper>
                </Grid>

                {/* Piyasa Özeti */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {intl.formatMessage({ id: 'dashboard.market' })}
                        </Typography>
                        <Suspense fallback={<WidgetLoader />}>
                            <MarketOverview />
                        </Suspense>
                    </Paper>
                </Grid>

                {/* Haberler */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {intl.formatMessage({ id: 'dashboard.news' })}
                        </Typography>
                        <Suspense fallback={<WidgetLoader />}>
                            <NewsPanel />
                        </Suspense>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// Error boundary ile sarılmış bileşeni export et
export default memo((props) => (
    <ErrorBoundary 
        name="Dashboard" 
        showError={process.env.NODE_ENV === 'development'}
        onRetry={() => window.location.reload()}
    >
        <Dashboard {...props} />
    </ErrorBoundary>
)); 