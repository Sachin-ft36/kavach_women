import React, { useEffect } from 'react';

const CRITICAL_IMAGES = [
  // Night theme
  '/assets/dashboard_assets/night/nighthero.png',
  '/assets/dashboard_assets/night/livefeed.jpeg',
  '/assets/dashboard_assets/night/streak/1.png',
  '/assets/dashboard_assets/night/streak/2.png',
  
  // Morning theme
  '/assets/dashboard_assets/morning/morninghero.png',
  '/assets/dashboard_assets/morning/background.jpeg',
  
  // Afternoon theme
  '/assets/dashboard_assets/afternoon/afternoonhero.jpeg',
  '/assets/dashboard_assets/afternoon/background.png',
  
  // Evening theme
  '/assets/dashboard_assets/evening/eveninghero.png',
  '/assets/dashboard_assets/evening/background.png',
];

export function ImagePreloader() {
  useEffect(() => {
    // We use requestIdleCallback so preloading doesn't block the main thread
    // during the initial app render.
    const preloadTask = () => {
      CRITICAL_IMAGES.forEach(async (src) => {
        try {
          const img = new Image();
          img.src = src;
          // Decode the image before showing, so it doesn't blink on first render
          await img.decode();
        } catch (e) {
          console.warn(`Failed to preload image: ${src}`, e);
        }
      });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadTask);
    } else {
      setTimeout(preloadTask, 1000); // Fallback
    }
  }, []);

  return null; // Invisible component
}
