import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import analytics from './services/analytics';
import { initErrorTracking } from './services/errorTracking';

import { store } from './store';
import ErrorBoundary from './components/ErrorBoundary';
import Notifications from './components/common/Notifications';
import OfflineIndicator from './components/common/OfflineIndicator';
import { LanguageProvider } from './i18n/LanguageContext';
import LanguageSwitcher from './components/common/LanguageSwitcher';

// Lazy load components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Login = React.lazy(() => import('./components/auth/Login'));
const PrivateRoute = React.lazy(() => import('./components/layout/PrivateRoute'));
const AIChat = React.lazy(() => import('./components/AIChat'));
const Settings = React.lazy(() => import('./components/Settings'));

// Loading component
const LoadingScreen = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh'
        }}
    >
        <CircularProgress />
    </Box>
);

// Tema oluştur
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

// Error tracking'i başlat
initErrorTracking();

const App = () => {
    const location = useLocation();

    // Sayfa görüntülemelerini takip et
    useEffect(() => {
        analytics.pageView(location.pathname);
    }, [location]);

    return (
        <Provider store={store}>
            <LanguageProvider>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <ErrorBoundary 
                        name="App" 
                        showError={process.env.NODE_ENV === 'development'}
                        onRetry={() => window.location.reload()}
                    >
                        <Router>
                            <Notifications />
                            <OfflineIndicator />
                            <LanguageSwitcher />
                            <Suspense fallback={<LoadingScreen />}>
                                <Routes>
                                    <Route path="/login" element={<Login />} />
                                    <Route 
                                        path="/dashboard" 
                                        element={
                                            <PrivateRoute>
                                                <Dashboard />
                                            </PrivateRoute>
                                        } 
                                    />
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/chat" element={<AIChat userId="test-user" />} />
                                    <Route path="/settings" element={<Settings />} />
                                </Routes>
                            </Suspense>
                        </Router>
                    </ErrorBoundary>
                </ThemeProvider>
            </LanguageProvider>
        </Provider>
    );
};

export default App; 