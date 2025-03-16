import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

export const initErrorTracking = () => {
    if (SENTRY_DSN) {
        Sentry.init({
            dsn: SENTRY_DSN,
            integrations: [new BrowserTracing()],
            tracesSampleRate: 1.0,
            environment: process.env.NODE_ENV,
            beforeSend(event) {
                // Hassas bilgileri temizle
                if (event.user) {
                    delete event.user.email;
                    delete event.user.ip_address;
                }
                return event;
            }
        });
    }
};

export const setUserContext = (user) => {
    if (SENTRY_DSN) {
        Sentry.setUser({
            id: user.id,
            username: user.username
        });
    }
};

export const captureError = (error, context = {}) => {
    if (SENTRY_DSN) {
        Sentry.withScope((scope) => {
            scope.setExtras(context);
            Sentry.captureException(error);
        });
    }
}; 