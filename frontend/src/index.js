/**
 * ============================================
 * PropLedger - Application Entry Point
 * ============================================
 * Initializes React application and renders root component
 * 
 * @author Ravi Makwana
 * @version 1.0.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/modern.css';
import App from './App';
import { register as registerSW } from './serviceWorkerRegistration';

// Create root element and render application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for PWA (offline support + install prompt)
// Active only in production builds; development uses a no-op.
registerSW();
