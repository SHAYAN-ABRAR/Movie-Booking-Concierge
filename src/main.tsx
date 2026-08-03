import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
// Side-effecting: initialises i18next synchronously from bundled resources
// before the first render, so no component ever sees a missing translation.
import './i18n';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root was not found in index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
