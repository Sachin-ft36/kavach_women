import React, { useEffect, useRef, useState } from 'react';
import { useKavachStore } from '../../store/useKavachStore';
import { fetchRouteMappls } from '../../services/MapplsService';
import { X, PhoneCall, Navigation, CheckCircle2 } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { cn } from '../../lib/utils';

const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "wyzopujjvzdbyogtdyzhbguilecucgwgfpmg";

export default function MapplsVictimMap({ 
  activeAlerts = [], 
  onClose, 
  isInterceptMode = false, 
  isNavigating = false,
  onToggleNav,
  onResolve,
  distance = '---'
}: any) {
  const { userPos } = useKavachStore();
  const { initiateCall } = useCall();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const victimMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkAndInit = () => {
      if ((window as any).mappls) {
        initMap();
      } else {
        setTimeout(checkAndInit, 200);
      }
    };

    if (document.getElementById('mappls-sdk')) {
      checkAndInit();
      return;
    }

    const script = document.createElement('script');
    script.id = 'mappls-sdk';
    script.src = `https://apis.mappls.com/advancedmaps/api/${REST_KEY}/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.onload = checkAndInit;
    document.body.appendChild(script);
  }, []);

  const mapId = useRef(`mappls-map-${Math.random().toString(36).substring(7)}`).current;

  const initMap = () => {
    const Mappls = (window as any).mappls;
    if (Mappls && !mapRef.current) {
      mapRef.current = new Mappls.Map(mapId, {
        center: [userPos?.[0] || 28.61, userPos?.[1] || 77.23],
        zoom: 15,
        hybrid: true, // Satellite + Streets view
      });
      console.log("🛰️ KAVACH: Mappls Native Engine Online!");
      
      // Wait for map load
      mapRef.current.on('load', () => setIsLoaded(true));
    }
  };

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userPos) return;
    const Mappls = (window as any).mappls;
    const uCoords = { lat: userPos[0], lng: userPos[1] };

    if (!userMarkerRef.current) {
      userMarkerRef.current = new Mappls.Marker({
        map: mapRef.current,
        position: uCoords,
        html: `<div style="width: 16px; height: 16px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);"></div>`,
        width: 16, height: 16
      });
    } else {
      userMarkerRef.current.setPosition(uCoords);
    }

    if (isNavigating) {
      mapRef.current.setCenter(uCoords);
      mapRef.current.setZoom(18);
    }

    const activeAlert = activeAlerts.find((a: any) => a.status === 'active' || a.status === 'responding');
    if (activeAlert) {
      const vLat = activeAlert.latitude || activeAlert.location?.latitude || activeAlert.location?.lat;
      const vLng = activeAlert.longitude || activeAlert.location?.longitude || activeAlert.location?.lng;
      if (vLat && vLng) {
        const vCoords = { lat: vLat, lng: vLng };
        
        if (!victimMarkerRef.current) {
          victimMarkerRef.current = new Mappls.Marker({
            map: mapRef.current,
            position: vCoords,
            html: `<div style="width: 20px; height: 20px; background: #EF4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);"></div>`,
            width: 20, height: 20
          });
        } else {
          victimMarkerRef.current.setPosition(vCoords);
        }

        // Smart API Throttling (15m threshold)
        let shouldFetch = false;
        const prev = (window as any)._last_mappls_route_coords;
        if (!prev) {
          shouldFetch = true;
        } else {
          const distSq = Math.pow(userPos[1] - prev.uLng, 2) + Math.pow(userPos[0] - prev.uLat, 2);
          if (distSq > 0.0000005) shouldFetch = true;
        }

        if (shouldFetch) {
          (window as any)._last_mappls_route_coords = { uLng: userPos[1], uLat: userPos[0] };
          fetchRouteMappls(userPos[1], userPos[0], vLng, vLat).then(route => {
            if (route && route.length > 0) {
              // Mappls Polyline requires {lat, lng} array
              const path = [...route.map((c: any) => ({ lat: c[1], lng: c[0] })), vCoords];
              
              if (polylineRef.current) {
                polylineRef.current.setPath(path);
              } else {
                polylineRef.current = new Mappls.Polyline({
                  map: mapRef.current,
                  path: path,
                  strokeColor: '#3B82F6',
                  strokeWeight: 6,
                  strokeOpacity: 0.8
                });
              }

              if (!isNavigating) {
                const bounds = new Mappls.LatLngBounds();
                bounds.extend(uCoords);
                bounds.extend(vCoords);
                mapRef.current.fitBounds(bounds, { padding: 40 });
              }
            }
          });
        }
      }
    }
  }, [userPos, activeAlerts, isLoaded, isNavigating]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0F172A] rounded-[40px]">
      <div id={mapId} style={{ width: '100%', height: '100%', display: 'inline-block' }} />
      <div className={cn("absolute left-6 z-[10] flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-lg transition-all", isInterceptMode ? "top-24" : "top-6")}>
         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
         <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Mappls ISRO Engine</span>
      </div>

      {isInterceptMode && onClose && (
        <div className="absolute top-8 left-6 z-[20] pointer-events-auto">
          <button onClick={onClose} className="w-10 h-10 bg-white text-[#0F172A] rounded-full shadow-xl flex items-center justify-center border border-gray-100 active:scale-95 transition-transform">
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      )}

      {isInterceptMode && (
        <div className="absolute inset-x-0 bottom-6 px-4 z-[20] pointer-events-none">
          <div className="w-full max-w-[500px] mx-auto bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 pointer-events-auto flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-[#0F172A]">{parseInt(distance) < 50 ? 'Arrived' : 'ETA Active'}</span>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{distance}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onToggleNav} className={cn("px-4 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm transition-all active:scale-95", isNavigating ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-600 text-white shadow-blue-600/20")}>
                  <Navigation size={12} fill={isNavigating ? "currentColor" : "none"} />
                  <span>{isNavigating ? "Stop" : "Navigate"}</span>
                </button>
                <button onClick={onResolve} className="px-4 py-3 bg-white text-emerald-600 border border-emerald-100 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">
                  <CheckCircle2 size={12} /> Safe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
