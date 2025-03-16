import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <Snackbar 
            open={!isOnline} 
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert 
                severity="warning" 
                icon={<WifiOffIcon />}
                sx={{ width: '100%' }}
            >
                Çevrimdışı moddasınız. Bazı özellikler kullanılamayabilir.
            </Alert>
        </Snackbar>
    );
};

export default OfflineIndicator; 