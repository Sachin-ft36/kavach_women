import { useEffect, useRef, useState } from 'react';

const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "wyzopujjvzdbyogtdyzhbguilecucgwgfpmg";

export function useMapplsInit(userPos: { lat: number; lng: number } | null, onFallback?: () => void) {
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapId = useRef(`mappls-map-${Math.random().toString(36).substring(7)}`).current;

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const checkAndInit = () => {
      if (!isMounted) return;
      if ((window as any).mappls) {
        initMap();
      } else {
        retryCount++;
        if (retryCount > 15) {
          console.error("Mappls SDK Initialization Timeout. Triggering fallback.");
          if (onFallback) onFallback();
          return;
        }
        setTimeout(checkAndInit, 200);
      }
    };

    if (document.getElementById('mappls-sdk')) {
      checkAndInit();
      return;
    }

    const script = document.createElement('script');
    script.id = 'mappls-sdk';
    script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${REST_KEY}`;
    script.async = true;
    script.onerror = () => {
      console.error("Mappls SDK Network Failure. Triggering fallback.");
      if (onFallback) onFallback();
    };

    script.onload = () => {
      if (!document.getElementById('mappls-plugins')) {
        const pluginsScript = document.createElement('script');
        pluginsScript.id = 'mappls-plugins';
        pluginsScript.src = `https://sdk.mappls.com/map/sdk/plugins?access_token=${REST_KEY}&v=3.0`;
        pluginsScript.async = true;
        pluginsScript.onload = checkAndInit;
        document.body.appendChild(pluginsScript);
      } else {
        checkAndInit();
      }
    };

    document.body.appendChild(script);

    return () => {
      isMounted = false;
      if (mapRef.current && typeof mapRef.current.remove === 'function') {
        try { mapRef.current.remove(); mapRef.current = null; } catch(e) {}
      }
    };
  }, []);

  const initMap = () => {
    const Mappls = (window as any).mappls;
    const container = document.getElementById(mapId);
    if (Mappls && !mapRef.current && container) {
      container.innerHTML = '';
      mapRef.current = new Mappls.Map(mapId, {
        center: [userPos?.lat || 28.61, userPos?.lng || 77.23],
        zoom: 17,
        mapType: 'standard',
        zoomControl: false,
        location: false,
        locationControl: false,
        mapTypeControl: false,
        layerControl: false,
        fullscreenControl: false,
        searchControl: false
      });
      console.log("🛰️ KAVACH: Mappls Native Engine Online!");

      if (mapRef.current && typeof mapRef.current.on === 'function') {
        mapRef.current.on('styleimagemissing', (e: any) => {
          try {
            const width = 16;
            const bytesPerPixel = 4;
            const data = new Uint8Array(width * width * bytesPerPixel);
            mapRef.current.addImage(e.id, { width: width, height: width, data: data });
          } catch (err) {}
        });

        const controls = document.querySelectorAll('[class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"]');
        controls.forEach(c => (c as HTMLElement).style.display = 'none');

        mapRef.current.on('load', () => {
          setIsLoaded(true);
          setTimeout(() => {
            document.querySelectorAll('.mappls-ctrl button, .mapboxgl-ctrl button, div.mappls-ctrl-top-right, div.mapboxgl-ctrl-top-right, div.mmi-ctrl-top-right, div.mappls-ctrl-bottom-right, div.mapboxgl-ctrl-bottom-right, div.mmi-ctrl-bottom-right').forEach(el => el.remove());
          }, 1000);
        });
      }
    }
  };

  return { mapRef, isLoaded, mapId };
}
