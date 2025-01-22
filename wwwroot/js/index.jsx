import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { getApiBaseUrl } from './config';

const root = ReactDOM.createRoot(document.getElementById('root'));
await getApiBaseUrl();
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);