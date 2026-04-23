import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { Toaster } from 'sonner';

import { LanguageProvider } from './contexts/LanguageContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
      <Toaster position="top-center" theme="dark" />
    </LanguageProvider>
  </StrictMode>,
);

// Register Service Worker for National Neural Network background persistence
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('KAVACH National Neural Network Online:', reg.scope);
    }).catch((err) => {
      console.error('KAVACH Link Error:', err);
    });
  });
}
