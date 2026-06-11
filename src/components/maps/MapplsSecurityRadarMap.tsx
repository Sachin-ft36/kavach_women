import React, { useEffect, useRef, useState, memo } from 'react';
import { useKavachStore } from '../../store/useKavachStore';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "hiexfwnhftspmoasdsnuwukpxugoaljlqhls";

const MapplsSecurityRadarMap = memo(({ protectors = [], activeRadius = 1.0, onFallback }: any) => {
  const { userPos, activeAlertId, isSOSActive } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<any>({});
  const circleRef = useRef<any>(null);
  const [responderId, setResponderId] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const checkAndInit = () => {
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
      if (mapRef.current && typeof mapRef.current.remove === 'function') {
        try { mapRef.current.remove(); mapRef.current = null; } catch(e) {}
      }
    };
  }, []);

  const mapId = useRef(`mappls-radar-${Math.random().toString(36).substring(7)}`).current;

  const initMap = () => {
    const Mappls = (window as any).mappls;
    if (Mappls && !mapRef.current) {
      mapRef.current = new Mappls.Map(mapId, {
        center: [userPos?.lat || 28.61, userPos?.lng || 77.23],
        zoom: 13,
      });
      mapRef.current.on('load', () => setIsLoaded(true));
    }
  };

  useEffect(() => {
    if (!activeAlertId || !isSOSActive) {
      setResponderId(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'alerts', activeAlertId), (snap) => {
      if (snap.exists()) {
        setResponderId(snap.data().responderUid || null);
      }
    });
    return () => unsub();
  }, [activeAlertId, isSOSActive]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userPos) return;
    const Mappls = (window as any).mappls;
    const centerLat = userPos.lat;
    const centerLng = userPos.lng;

    if (!markersRef.current['user']) {
        markersRef.current['user'] = new Mappls.Marker({
            map: mapRef.current,
            position: { lat: centerLat, lng: centerLng },
            html: `<div class="pulse-marker-user"></div>`,
            width: 32, height: 32,
            offset: [16, 16]
        });
    } else {
        markersRef.current['user'].setPosition({ lat: centerLat, lng: centerLng });
    }
    
    if (circleRef.current) {
       if (typeof circleRef.current.setRadius === 'function' && typeof circleRef.current.setCenter === 'function') {
           circleRef.current.setRadius(activeRadius * 1000);
           circleRef.current.setCenter({ lat: centerLat, lng: centerLng });
       } else {
           if (typeof circleRef.current.remove === 'function') {
               circleRef.current.remove();
           }
           circleRef.current = null;
       }
    }
    
    if (!circleRef.current) {
       circleRef.current = new Mappls.Circle({
         map: mapRef.current,
         center: { lat: centerLat, lng: centerLng },
         radius: activeRadius * 1000,
         fillColor: '#3B82F6',
         fillOpacity: 0.02,
         strokeColor: '#3B82F6',
         strokeOpacity: 0.4,
         strokeWeight: 2,
       });
    }

  }, [userPos, activeRadius, isLoaded]);

  useEffect(() => {
      if (!isLoaded || !mapRef.current) return;
      const Mappls = (window as any).mappls;

      const activeIds = protectors.map((p:any) => p.id || p.uid);
      Object.keys(markersRef.current).forEach(id => {
          if (id !== 'user' && !activeIds.includes(id)) {
              markersRef.current[id].remove();
              delete markersRef.current[id];
          }
      });

      protectors.forEach((p:any) => {
        const lat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.coords?.[0];
        const lng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.coords?.[1];
        if (!lat || !lng) return;
        const pid = p.id || p.uid;
        const isResponder = pid === responderId;
        const occupation = p.protectorVetting?.occupation || p.profession || '';
        const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some((role:string) => 
          occupation.toLowerCase().includes(role.toLowerCase())
        );

        const markerColor = isElite ? '#F59E0B' : (isResponder ? '#10B981' : '#0A84FF');
        const markerGlow = isElite ? '#F59E0B' : (isResponder ? '#10B981' : '#0A84FF');
        const markerSize = isElite ? '16px' : '12px';

        const html = isResponder ? `<div class="pulse-marker-responder"></div>` : `<div style="
              background: ${markerColor}; 
              width: ${markerSize}; 
              height: ${markerSize}; 
              border-radius: 50%; 
              border: 2px solid white; 
            "></div>`;

        if (!markersRef.current[pid]) {
            markersRef.current[pid] = new Mappls.Marker({
                map: mapRef.current,
                position: { lat, lng },
                html: html,
                width: isResponder ? 36 : parseInt(markerSize),
                height: isResponder ? 36 : parseInt(markerSize),
                offset: isResponder ? [18, 18] : [parseInt(markerSize)/2, parseInt(markerSize)/2]
            });
        } else {
            markersRef.current[pid].setPosition({ lat, lng });
            markersRef.current[pid].setIcon(html); // Update HTML just in case
        }
      });
  }, [protectors, isLoaded, responderId]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-[#050505]">
      <style>{`
        .pulse-marker-user {
          width: 16px; height: 16px;
          background: #FFF; border: 3px solid #0A84FF;
          border-radius: 50%; position: relative;
          margin: 8px;
        }
        .pulse-marker-responder {
          width: 16px; height: 16px;
          background: #10B981; border: 3px solid white;
          border-radius: 50%; position: relative;
          margin: 10px;
        }
      `}</style>
      <div id={mapId} className="absolute inset-0 w-full h-full" />
    </div>
  );
});

export default MapplsSecurityRadarMap;
