import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import '../index.css';

import { Toaster } from 'sonner';

import { LanguageProvider } from '../contexts/LanguageContext';
import { CallProvider } from '../contexts/CallContext';
import { ThemeProvider } from '../providers/ThemeProvider';
import { MotionConfig } from 'motion/react';

createRoot(document.getElementById('root')!).render(
  <MotionConfig reducedMotion="never">
    <ThemeProvider>
      <CallProvider>
        <LanguageProvider>
          <App />
          <Toaster position="top-center" theme="dark" />
        </LanguageProvider>
      </CallProvider>
    </ThemeProvider>
  </MotionConfig>,
);

// 🛡️ Register Service Worker for background persistence
// Deferred to avoid InvalidStateError during Firebase redirect auth return
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Small delay ensures document is in valid state after any auth redirect
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('KAVACH Neural Network Online:', reg.scope);
      }).catch((err) => {
        // InvalidStateError happens during Firebase redirect auth — safe to ignore
        if (err.name !== 'InvalidStateError') {
          console.warn('KAVACH ServiceWorker:', err.message);
        }
      });
    }, 1000);
  });
}
