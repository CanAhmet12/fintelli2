import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';
import { removeNotification } from '../../store/slices/notificationSlice';

const Notifications = () => {
    const dispatch = useDispatch();
    const notifications = useSelector(state => state.notification.notifications);

    const handleClose = (id) => {
        dispatch(removeNotification(id));
    };

    return (
        <>
            {notifications.map((notification) => (
                <Snackbar
                    key={notification.id}
                    open={true}
                    autoHideDuration={6000}
                    onClose={() => handleClose(notification.id)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => handleClose(notification.id)}
                        severity={notification.type}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            ))}
        </>
    );
};

export default Notifications; 