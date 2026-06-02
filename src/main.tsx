import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { Toaster } from 'sonner';

import { LanguageProvider } from './contexts/LanguageContext';
import { CallProvider } from './contexts/CallContext';
import { MotionConfig } from 'motion/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="never">
      <CallProvider>
        <LanguageProvider>
        <App />
        <Toaster position="top-center" theme="dark" />
      </LanguageProvider>
    </CallProvider>
    </MotionConfig>
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
