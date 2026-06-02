import React, { useEffect, useRef, useState } from 'react';
import { useKavachStore } from '../../store/useKavachStore';
import { fetchRouteMappls } from '../../services/MapplsService';
import { X, PhoneCall, Navigation, CheckCircle2, Crosshair, Zap, Activity, Layers, LocateFixed } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { cn } from '../../lib/utils';

const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "hiexfwnhftspmoasdsnuwukpxugoaljlqhls";

export default function MapplsVictimMap({
  activeAlerts = [],
  onClose,
  isInterceptMode = false,
  isNavigating = false,
  onToggleNav,
  onResolve,
  distance = '---',
  onFallback
}: any) {
  const { userPos } = useKavachStore();
  const { initiateCall } = useCall();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const victimMarkerRef = useRef<any>(null);
  const directionPluginRef = useRef<any>(null);
  const ridePolylineRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const activeAlert = activeAlerts.find((a: any) => a.status === 'active' || a.status === 'responding');
  const target = activeAlert;

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
  }, []);

  const mapId = useRef(`mappls-map-${Math.random().toString(36).substring(7)}`).current;

  const initMap = () => {
    const Mappls = (window as any).mappls;
    if (Mappls && !mapRef.current) {
      mapRef.current = new Mappls.Map(mapId, {
        center: [userPos?.[0] || 28.61, userPos?.[1] || 77.23],
        zoom: 15,
        mapType: 'standard', // 🗺️ EXPLICITLY TELL MAPPLS TO LOAD NORMAL MAP
        zoomControl: false,
        location: false,
        locationControl: false,
        mapTypeControl: false,
        layerControl: false,
        fullscreenControl: false,
        searchControl: false
      });
      console.log("🛰️ KAVACH: Mappls Native Engine Online!");

      // Also manually remove any auto-injected DOM controls just to be safe
      const controls = document.querySelectorAll('[class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"]');
      controls.forEach(c => (c as HTMLElement).style.display = 'none');

      mapRef.current.on('load', () => {
        setIsLoaded(true);
        // NUKE any native buttons that somehow survived CSS
        setTimeout(() => {
          document.querySelectorAll('.mappls-ctrl button, .mapboxgl-ctrl button, div.mappls-ctrl-top-right, div.mapboxgl-ctrl-top-right, div.mmi-ctrl-top-right, div.mappls-ctrl-bottom-right, div.mapboxgl-ctrl-bottom-right, div.mmi-ctrl-bottom-right').forEach(el => el.remove());
        }, 1000);
      });
    }
  };

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userPos) return;
    const Mappls = (window as any).mappls;
    const uCoords = { lat: userPos[0], lng: userPos[1] };

    // User Marker Update
    if (!userMarkerRef.current) {
      userMarkerRef.current = new Mappls.Marker({
        map: mapRef.current,
        position: uCoords,
        html: `<div class="pulse-marker-protector"></div>`,
        width: 36, height: 36,
        offset: [18, 18]
      });
    } else {
      userMarkerRef.current.setPosition(uCoords);
    }

    if (isNavigating) {
      mapRef.current.setCenter(uCoords);
      mapRef.current.setZoom(18);
    }

    if (activeAlert) {
      const vLat = activeAlert.latitude || activeAlert.location?.latitude || activeAlert.location?.lat;
      const vLng = activeAlert.longitude || activeAlert.location?.longitude || activeAlert.location?.lng;
      const vEloc = activeAlert.mapplsId || activeAlert.mappls_id;

      // ✨ Sahi Gali wala entry gate (fallback to actual location if gate is unknown)
      const routingLat = activeAlert.location?.routingLat || vLat;
      const routingLng = activeAlert.location?.routingLng || vLng;

      if (vLat && vLng) {
        const vCoords = vEloc ? { eloc: vEloc } : { lat: vLat, lng: vLng };

        if (!victimMarkerRef.current) {
          victimMarkerRef.current = new Mappls.Marker({
            map: mapRef.current,
            position: vCoords,
            html: `<div class="pulse-marker-victim"></div>`,
            width: 50, height: 50,
            offset: [25, 25]
          });
        } else {
          victimMarkerRef.current.setPosition(vCoords);
        }

        // ✨ GHAR KO HIGHLIGHT KARNA (GeoJSON POLYGON)
        if (routingLat && routingLng && mapRef.current) {
          try {
            const offset = 0.00015;
            const polygonData = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                      [
                        [routingLng - offset, routingLat + offset],
                        [routingLng + offset, routingLat + offset],
                        [routingLng + offset, routingLat - offset],
                        [routingLng - offset, routingLat - offset],
                        [routingLng - offset, routingLat + offset]
                      ]
                    ]
                  },
                  "properties": {
                    "name": "Target Location",
                    "stroke": "#EF4444",
                    "strokeOpacity": 0.8,
                    "strokeWidth": 3,
                    "fill": "#EF4444",
                    "fillOpacity": 0.3
                  }
                }
              ]
            };

            // ✨ CONTINUOUS TARGET LOCK (Native Mapbox Source for Flicker-Free Movement)
            const sourceId = `victim-target-source`;

            if (mapRef.current.getSource && mapRef.current.addSource) {
              if (mapRef.current.getSource(sourceId)) {
                // Smoothly update the position WITHOUT deleting the layer (No flicker!)
                mapRef.current.getSource(sourceId).setData(polygonData);
              } else {
                // Create the source and layer for the first time
                mapRef.current.addSource(sourceId, { type: 'geojson', data: polygonData });

                mapRef.current.addLayer({
                  id: `victim-target-layer-fill`,
                  type: 'fill',
                  source: sourceId,
                  paint: {
                    'fill-color': '#EF4444',
                    'fill-opacity': 0.3
                  }
                });

                mapRef.current.addLayer({
                  id: `victim-target-layer-line`,
                  type: 'line',
                  source: sourceId,
                  paint: {
                    'line-color': '#EF4444',
                    'line-width': 3,
                    'line-opacity': 0.8
                  }
                });
              }
            }
          } catch (e) {
            console.error("Smooth GeoJSON Highlight Error:", e);
          }
        }

        // 🔄 ADVANCED LIVE REFRESH LOGIC
        let shouldFetch = false;
        const prev = (window as any)._last_mappls_route_coords;
        const lastFetchTime = (window as any)._last_mappls_fetch_time || 0;
        const currentTime = Date.now();

        if (!prev) {
          shouldFetch = true;
        } else {
          // Agar user 15 meters se zyada hila ho
          const distSq = Math.pow(userPos[1] - prev.uLng, 2) + Math.pow(userPos[0] - prev.uLat, 2);
          // Ya fir sarak band/traffic update ke liye har 30 seconds me auto-refresh ho
          const timeElapsed = currentTime - lastFetchTime;

          if (distSq > 0.0000005 || timeElapsed > 30000) {
            shouldFetch = true;
          }
        }

        if (shouldFetch) {
          (window as any)._last_mappls_route_coords = { uLng: userPos[1], uLat: userPos[0] };
          (window as any)._last_mappls_fetch_time = currentTime;

          if (directionPluginRef.current) {
            directionPluginRef.current.remove();
          }

          // 🔥 REAL-TIME TRAFFIC AWARE TRACKING ENGINE (BIKE PLUGIN)
          if (!directionPluginRef.current) {
            Mappls.tracking({
              map: mapRef.current,
              start: { geoposition: `${userPos[0]},${userPos[1]}` },
              end: { geoposition: `${routingLat},${routingLng}` },
              fitBounds: !isNavigating,
              ccpIconWidth: 70,
              strokeWidth: 6,
              routeColor: "#3B82F6",
              sPopup: "", dPopup: "", // Try to hide default popups
              profile: 'walking',         // 🚶‍♀️ Use walking/biking profile to avoid huge U-turn driving routes
              resource: 'route_eta',
              traffic: true,
              incidents: true,
              alternatives: true,
              avoid: (window as any)._kavach_blocked_road || undefined,
            }, function (data: any) {
              directionPluginRef.current = data;
            });
          } else if (directionPluginRef.current.trackingCall) {
            directionPluginRef.current.trackingCall({
              location: [userPos[1], userPos[0]],
              reRoute: true,
              heading: true,
              mapCenter: isNavigating,
              buffer: 50,
              delay: 3000,
              fitBounds: false
            });
          }
        }
      }
    }

    // 🚨 RIDE SAFE ROUTE SYNC
    const { isRideModeActive, rideData } = useKavachStore.getState();

    if (isRideModeActive && rideData?.targetCoords && userPos && Mappls?.direction) {
      if (!ridePolylineRef.current) {
        console.log("🛰️ KAVACH: Initializing Native Mappls Tracking Plugin for RideSafe");
        Mappls.tracking({
          map: mapRef.current,
          start: { geoposition: `${userPos[0]},${userPos[1]}` },
          end: { geoposition: `${rideData.targetCoords[1]},${rideData.targetCoords[0]}` },
          fitBounds: false,
          ccpIconWidth: 70,
          strokeWidth: 6,
          routeColor: "#3B82F6",
          sPopup: "", dPopup: "", // Hide popups
          profile: 'walking',          // 🚶‍♀️ Change to walking to show true shortest distance instead of vehicle U-turns
          resource: 'route_eta',
          traffic: true,
          incidents: true,
          avoid: (window as any)._kavach_blocked_road || undefined,
        }, function (data: any) {
          ridePolylineRef.current = data;
        });
      } else if (ridePolylineRef.current.trackingCall) {
        ridePolylineRef.current.trackingCall({
          location: [userPos[1], userPos[0]],
          reRoute: true,
          heading: true,
          mapCenter: isNavigating,
          buffer: 50,
          delay: 3000,
          fitBounds: false
        });
      }
    } else {
      if (ridePolylineRef.current) {
        if (ridePolylineRef.current.remove) ridePolylineRef.current.remove();
        ridePolylineRef.current = null;
      }
    }
  }, [userPos, activeAlerts, isLoaded, isNavigating, useKavachStore.getState().rideData?.targetCoords]);

  // 🛠️ CUSTOM RELIABLE MAP CONTROLS
  const [mapStyle, setMapStyle] = useState<'standard' | 'hybrid'>('standard');

  const toggleMapStyle = () => {
    const Mappls = (window as any).mappls;
    if (mapRef.current && Mappls) {
      const newStyle = mapStyle === 'standard' ? 'hybrid' : 'standard';

      try {
        // Official Mappls v3 Dynamic Layer Switch
        Mappls.setLayer(newStyle === 'standard' ? 'vector' : 'hybrid');
      } catch (e) {
        // Fallbacks
        if (typeof mapRef.current.setMapType === 'function') {
          mapRef.current.setMapType(newStyle);
        } else if (typeof mapRef.current.setStyle === 'function') {
          mapRef.current.setStyle(newStyle);
        }
      }
      setMapStyle(newStyle);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current && userPos) {
      mapRef.current.setCenter({ lat: userPos[0], lng: userPos[1] });
      mapRef.current.setZoom(17);
    }
  };

  const handleZoom = (inOut: 'in' | 'out') => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(inOut === 'in' ? currentZoom + 1 : currentZoom - 1);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0F172A]">
      <style>{`
        .pulse-marker-victim {
          width: 20px; height: 20px;
          background: #EF4444; border: 3px solid white;
          border-radius: 50%; position: relative;
          box-shadow: 0 0 10px rgba(239,68,68,0.8);
          margin: 15px; 
        }
        .pulse-marker-victim::after {
          content: ''; position: absolute;
          top: -15px; left: -15px; right: -15px; bottom: -15px;
          border-radius: 50%; border: 2px solid rgba(239,68,68,0.8);
          animation: radarPulse 1s ease-out infinite;
        }
        .pulse-marker-protector {
          width: 16px; height: 16px;
          background: #3B82F6; border: 3px solid white;
          border-radius: 50%; position: relative;
          box-shadow: 0 0 15px rgba(59,130,246,0.8);
          margin: 10px;
        }
        .pulse-marker-protector::after {
          content: ''; position: absolute;
          top: -12px; left: -12px; right: -12px; bottom: -12px;
          border-radius: 50%; border: 2px dashed rgba(59,130,246,0.6);
          animation: spinPulse 4s linear infinite;
        }
        @keyframes radarPulse {
          0% { transform: scale(0.5); opacity: 1; border-width: 4px; }
          100% { transform: scale(2); opacity: 0; border-width: 1px; }
        }
        @keyframes spinPulse {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        /* 🚫 Hide ONLY the ugly Green Start/End Markers via precise CSS, but keep the Bike! */
        div[title="Start"], div[title="End"], 
        .mappls-marker[style*="marker.png"], 
        .mapboxgl-marker[style*="marker.png"],
        .mapboxgl-popup, .mappls-popup {
          display: none !important;
        }
        /* Make sure the map doesn't show direction boxes */
        [class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"],
        .mappls-ctrl, .mapboxgl-ctrl, .mmi-ctrl, .mappls-control,
        [title="Map layers"], [title="Map Layers"] { 
          display: none !important; 
        }
        /* Hidden native boxes to preserve HUD */
        .mappls-direction-box, .mappls-direction-step-container, 
        .mappls-direction-header, .mappls-direction-summary, .mappls-routing-box { 
          display: none !important; 
        }
      `}</style>
      <div id={mapId} style={{ width: '100%', height: '100%', display: 'inline-block' }} />
      <div id={`direction-container-${mapId}`} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px', overflow: 'hidden' }} />

      {/* 🚀 BULLETPROOF REACT MAP CONTROLS - VERTICALLY CENTERED */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[20] flex flex-col gap-3 pointer-events-auto">
        {/* Layer Switcher Removed */}

        {/* Zoom Controls */}
        <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
          <button onClick={() => handleZoom('in')} className="w-12 h-12 flex items-center justify-center active:bg-gray-100 border-b border-gray-100 transition-colors">
            <span className="text-gray-700 text-xl font-medium leading-none">+</span>
          </button>
          <button onClick={() => handleZoom('out')} className="w-12 h-12 flex items-center justify-center active:bg-gray-100 transition-colors">
            <span className="text-gray-700 text-3xl font-medium leading-none mb-1">-</span>
          </button>
        </div>

        {/* Recenter / My Location */}
        <button onClick={handleRecenter} className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center active:scale-90 transition-all mt-1">
          <Crosshair size={22} className="text-blue-600" />
        </button>
      </div>

      {/* TACTICAL HUD */}
      {isInterceptMode && (
        <div className="absolute top-40 right-4 flex flex-col gap-3 z-[20] pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-red-500/30 p-3 rounded-2xl flex flex-col items-end shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <span className="text-[7px] text-red-500 font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5"><Crosshair size={10} className="animate-spin-slow" /> TARGET LOCK</span>
            <span className="text-2xl text-white font-black italic tracking-tighter tabular-nums leading-none mt-2">{distance}</span>
            <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-1">Intercept Distance</span>
          </div>
          {isNavigating && (
            <div className="bg-blue-600/90 backdrop-blur-md border border-blue-400 p-3 rounded-2xl flex flex-col items-end shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <span className="text-[7px] text-blue-200 font-black uppercase tracking-widest flex items-center gap-1"><Activity size={10} /> ROUTING ETA</span>
              <span className="text-xl text-white font-black italic tracking-tighter tabular-nums leading-none mt-2">
                {parseInt(distance) > 0 ? `${Math.ceil(parseInt(distance) / 1000 * 2.5)} MIN` : '1 MIN'}
              </span>
            </div>
          )}
        </div>
      )}

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