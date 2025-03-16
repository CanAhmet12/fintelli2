import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './services/performance'; // Performance monitoring'i başlat

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

// Service worker'ı kaydet
serviceWorker.register({
    onUpdate: (registration) => {
        // Yeni versiyon varsa kullanıcıya bildir
        const waitingServiceWorker = registration.waiting;

        if (waitingServiceWorker) {
            waitingServiceWorker.addEventListener("statechange", event => {
                if (event.target.state === "activated") {
                    window.location.reload();
                }
            });
            waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
        }
    }
}); 