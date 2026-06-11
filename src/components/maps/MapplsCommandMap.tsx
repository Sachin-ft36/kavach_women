import React, { useEffect, useRef, useState } from 'react';
import { fetchRouteMappls, fetchRouteDetails } from '../../services/MapplsService';
import { useKavachStore } from '../../store/useKavachStore';
import { cn } from '../../lib/utils';
import { LocateFixed, Navigation, Activity, Layers, Compass } from 'lucide-react';

const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "wyzopujjvzdbyogtdyzhbguilecucgwgfpmg";

interface MapplsCommandMapProps {
  activeAlerts: any[];
  activeProtectors: any[];
  pendingProtectors?: any[];
  activeFirs?: any[];
  activeJourneys?: any[];
  onAlertClick?: (id: string) => void;
  centerOverride?: [number, number];
  selectedState?: string;
  selectedAlertId?: string | null;
  selectedProtectorId?: string | null;
  isSovereignActive?: boolean;
  showHeatmap?: boolean;
  victimPath?: any[];
  protectorPath?: any[];
  safePath?: any[];
  projectedPath?: any[];
  replayProgress?: number;
  dangerZonesKmlUrl?: string; // Add KML support for Danger Zones
  jurisdictionKmlUrl?: string; // Add KML support for Police Jurisdictions
  onFallback?: () => void;
}

export default function MapplsCommandMap({
  activeAlerts,
  activeProtectors,
  activeJourneys = [],
  selectedAlertId,
  selectedState,
  victimPath,
  protectorPath,
  dangerZonesKmlUrl,
  jurisdictionKmlUrl,
  onFallback,
  onAlertClick
}: MapplsCommandMapProps) {
  const { userPos } = useKavachStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);
  const dangerKmlRef = useRef<any>(null);
  const jurisdictionKmlRef = useRef<any>(null);
  const prevSelectedAlertIdRef = useRef<string | null>(null);
  const navRouteLineRef = useRef<any>(null);
  const commandCenterMarkerRef = useRef<any>(null);
  const lastUserPosRef = useRef<number[]>([0, 0]);
  const headingRef = useRef<number>(0);

  // Map Style Toggle
  const [mapStyle, setMapStyle] = useState<'standard' | 'hybrid'>('standard');

  const toggleMapStyle = () => {
    const Mappls = (window as any).mappls;
    if (mapRef.current && Mappls) {
      const newStyle = mapStyle === 'standard' ? 'hybrid' : 'standard';

      try {
        // Official Mappls v3 Dynamic Layer Switch (Requires map object)
        Mappls.setLayer({ map: mapRef.current, layer: newStyle === 'standard' ? 'vector' : 'hybrid' });
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

  // Tactical Routing & Cockpit State
  const [routeInfo, setRouteInfo] = useState<{ distance: number, duration: number, fetchTime?: number } | null>(null);
  const [isCockpitMode, setIsCockpitMode] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000); // Update ETA every 15 seconds
    return () => clearInterval(interval);
  }, []);

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

  const mapId = useRef(`mappls-command-${Math.random().toString(36).substring(7)}`).current;

  const initMap = () => {
    const Mappls = (window as any).mappls;
    if (Mappls && !mapRef.current) {
      mapRef.current = new Mappls.Map(mapId, {
        center: [21.0, 78.9629],
        zoom: 4.2,
        zoomControl: false,
        location: false,
        locationControl: false,
        mapTypeControl: false,
        layerControl: false,
        fullscreenControl: false,
        searchControl: false
      });

      // 🧼 Silencing Mappls sprite image missing warnings in console (e.g. agricultural_automotive)
      mapRef.current.on('styleimagemissing', (e: any) => {
        try {
          const width = 16;
          const bytesPerPixel = 4;
          const data = new Uint8Array(width * width * bytesPerPixel);
          mapRef.current.addImage(e.id, { width: width, height: width, data: data });
        } catch (err) {}
      });
      
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

  // ✨ COCKPIT TRACKING EFFECT (FOLLOWING THE ACTIVE RESPONDER)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !isCockpitMode) return;

    let carLat: number | null = null;
    let carLng: number | null = null;

    // 1. Try to lock onto the specific responder for the selected mission
    if (selectedAlertId) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      if (alert?.activeResponders?.length > 0) {
        carLat = alert.activeResponders[0].lastLocation?.lat || alert.activeResponders[0].lat || alert.activeResponders[0].latitude;
        carLng = alert.activeResponders[0].lastLocation?.lng || alert.activeResponders[0].lng || alert.activeResponders[0].longitude;
      }
    }

    // 2. Lock onto the blue Command Center car if it exists
    if (!carLat || !carLng) {
      if (commandCenterMarkerRef.current && typeof commandCenterMarkerRef.current.getPosition === 'function') {
        const pos = commandCenterMarkerRef.current.getPosition();
        if (pos) {
          carLat = pos.lat;
          carLng = pos.lng;
        }
      }
    }

    // 3. If no mission is selected, but there are police cars on the map, lock onto the first police car
    if (!carLat || !carLng) {
      if (activeProtectors && activeProtectors.length > 0) {
        const p = activeProtectors[0];
        carLat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
        carLng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      }
    }

    const startTracking = (lat: number, lng: number) => {
      // Calculate basic heading from last pos to current pos if we don't have a device heading
      if (lastUserPosRef.current[0] !== 0) {
        const dy = lat - lastUserPosRef.current[0];
        const dx = lng - lastUserPosRef.current[1];
        if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
          headingRef.current = Math.atan2(dx, dy) * 180 / Math.PI;
        }
      }
      lastUserPosRef.current = [lat, lng];

      if (mapRef.current && typeof mapRef.current.easeTo === 'function') {
        mapRef.current.easeTo({
          center: [lng, lat],
          zoom: 19.5,
          pitch: 0,
          bearing: headingRef.current || 0,
          duration: 1000,
          easing: (t: number) => t
        });
      }
    };

    if (carLat && carLng) {
      startTracking(carLat, carLng);
    } else {
      // 4. Ultimate fallback to live location or default
      const isDefaultPos = userPos && Math.abs(userPos.lat - 20.5937) < 0.001 && Math.abs(userPos.lng - 78.9629) < 0.001;
      if (userPos && userPos.length === 2 && !isDefaultPos) {
        startTracking(userPos.lat, userPos.lng);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { if (isCockpitMode) startTracking(pos.coords.latitude, pos.coords.longitude); },
          () => { },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
  }, [selectedAlertId, activeAlerts, activeProtectors, userPos, isCockpitMode, isLoaded]);

  // KML Initialization Effect
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    if (Mappls && Mappls.KmlLayer) {
      // 1. Danger Zones KML Overlay
      if (dangerZonesKmlUrl && !dangerKmlRef.current) {
        dangerKmlRef.current = new Mappls.KmlLayer({
          map: mapRef.current,
          url: dangerZonesKmlUrl,
          preserveViewport: true
        });
      }

      // 2. Police Jurisdiction Boundaries
      if (jurisdictionKmlUrl && !jurisdictionKmlRef.current) {
        jurisdictionKmlRef.current = new Mappls.KmlLayer({
          map: mapRef.current,
          url: jurisdictionKmlUrl,
          preserveViewport: true
        });
      }
    }
  }, [isLoaded, dangerZonesKmlUrl, jurisdictionKmlUrl]);

  // Tactical Navigation Sequence: Zoom Target -> Fly Command Center -> Plot Route
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    if (selectedAlertId && selectedAlertId !== prevSelectedAlertIdRef.current) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      const journey = activeJourneys.find(j => j.id === selectedAlertId || j.userId === selectedAlertId);

      if (alert) {
        const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
        const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;

        if (lat && lng) {
          try {
            const executeTacticalNavigation = async (commandCenterLat: number, commandCenterLng: number) => {
              if (typeof mapRef.current.flyTo === 'function') {

                try {
                  if (!Mappls) return;

                  let currentHeading = headingRef.current;
                  if (lastUserPosRef.current[0] !== 0 && userPos && (lastUserPosRef.current[0] !== userPos.lat || lastUserPosRef.current[1] !== userPos.lng)) {
                    const lat1 = lastUserPosRef.current[0];
                    const lng1 = lastUserPosRef.current[1];
                    const lat2 = userPos.lat;
                    const lng2 = userPos.lng;
                    const dy = lat2 - lat1;
                    const dx = Math.cos(Math.PI / 180 * lat1) * (lng2 - lng1);
                    const angle = Math.atan2(dy, dx);
                    currentHeading = (90 - angle * 180 / Math.PI + 360) % 360;
                    headingRef.current = currentHeading;
                  }
                  if (userPos) lastUserPosRef.current = userPos;

                  // 1. Render Command Center Base Marker IMMEDIATELY (As a Police Car)
                  const policeCarHtml = `
                    <div id="command-center-car" class="police-car-container" style="transform: rotate(${currentHeading}deg);">
                      <div class="police-beacon"></div>
                      <svg viewBox="0 0 100 100" class="police-car-svg">
                        <rect x="30" y="10" width="40" height="80" rx="15" fill="#1E3A8A" stroke="#FFFFFF" stroke-width="3"/>
                        <rect x="35" y="30" width="30" height="35" rx="5" fill="#0284C7"/>
                        <rect x="26" y="20" width="4" height="15" rx="2" fill="#000000"/>
                        <rect x="70" y="20" width="4" height="15" rx="2" fill="#000000"/>
                        <rect x="26" y="65" width="4" height="15" rx="2" fill="#000000"/>
                        <rect x="70" y="65" width="4" height="15" rx="2" fill="#000000"/>
                        <path d="M 35 15 L 65 15" stroke="#FBBF24" stroke-width="4"/>
                      </svg>
                    </div>
                  `;

                  if (!commandCenterMarkerRef.current) {
                    commandCenterMarkerRef.current = new Mappls.Marker({
                      map: mapRef.current,
                      position: { lat: commandCenterLat, lng: commandCenterLng },
                      html: policeCarHtml,
                      width: 46,
                      height: 46,
                      offset: [23, 23]
                    });
                  } else {
                    commandCenterMarkerRef.current.setPosition({ lat: commandCenterLat, lng: commandCenterLng });
                    const carEl = document.getElementById('command-center-car');
                    if (carEl) carEl.style.transform = `rotate(${currentHeading}deg)`;
                  }

                  // 2. Clear previous tactical navigation route if any
                  if (navRouteLineRef.current) {
                    try {
                      if (typeof navRouteLineRef.current.remove === 'function') navRouteLineRef.current.remove();
                      else if ((window as any).mappls?.remove) (window as any).mappls.remove({ map: mapRef.current, layer: navRouteLineRef.current });
                    } catch (e) { }
                    navRouteLineRef.current = null;
                  }

                  // ✨ 3. FETCH ROUTING HUD DATA IMMEDIATELY (No Delay!)
                  try {
                    fetchRouteDetails(commandCenterLng, commandCenterLat, lng, lat)
                      .then((details) => {
                        if (details) {
                          setRouteInfo({ ...details, fetchTime: Date.now() });
                        }
                      })
                      .catch(() => { });
                  } catch (e) { }

                  // 4. RESTORE CINEMATIC ANIMATION & BUILDING HIGHLIGHT
                  // Step A: Fly to Target (Victim) to trigger building highlight and show location
                  if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
                    mapRef.current.flyTo({ center: [lng, lat], zoom: 19, duration: 1500, pitch: 45 });
                  }

                  // Step B: Wait 3.0s for Target Inspection & Building Highlight, then Plot Route & Fly Back to Command Center
                  setTimeout(() => {
                    try {
                      fetchRouteMappls(commandCenterLng, commandCenterLat, lng, lat)
                        .then((coords) => {
                          if (coords && coords.length > 0) {
                            // Native Mapbox GL JS approach for 100% reliable rendering!
                            if (mapRef.current.getSource) {
                              const geojsonData = {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                  type: 'LineString',
                                  coordinates: coords // coords are already [[lng, lat]] from fetchRouteMappls!
                                }
                              };

                              if (mapRef.current.getSource('tactical-route-source')) {
                                mapRef.current.getSource('tactical-route-source').setData(geojsonData);
                              } else {
                                mapRef.current.addSource('tactical-route-source', { type: 'geojson', data: geojsonData });
                                mapRef.current.addLayer({
                                  id: 'tactical-route-line',
                                  type: 'line',
                                  source: 'tactical-route-source',
                                  layout: {
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                  },
                                  paint: {
                                    'line-color': '#0EA5E9',
                                    'line-width': 6,
                                    'line-opacity': 0.9
                                  }
                                });
                              }
                            }
                          }

                          // FLY BACK TO COMMAND CENTER (Live Location)
                          if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
                            mapRef.current.flyTo({
                              center: [commandCenterLng, commandCenterLat],
                              zoom: 16,
                              duration: 2500,
                              pitch: 60,
                              bearing: headingRef.current || 0
                            });
                          }
                        })
                        .catch(() => { });
                    } catch (e) { }
                  }, 3000);

                } catch (err) {
                  console.warn("Command Center Routing Failure:", err);
                }
              } else if (typeof mapRef.current.setCenter === 'function') {
                mapRef.current.setCenter({ lat, lng });
                if (typeof mapRef.current.setZoom === 'function') mapRef.current.setZoom(16);
              }
            };

            // 🎯 Get the True Police Responder Location (Not the browser's IP location)
            let startLat: number | null = null;
            let startLng: number | null = null;

            // 1. Try to lock onto the specific responder for the selected mission
            if (alert.activeResponders && alert.activeResponders.length > 0) {
              startLat = alert.activeResponders[0].lastLocation?.lat || alert.activeResponders[0].lat || alert.activeResponders[0].latitude;
              startLng = alert.activeResponders[0].lastLocation?.lng || alert.activeResponders[0].lng || alert.activeResponders[0].longitude;
            }

            // 2. Lock onto the first available police car on the map
            if (!startLat || !startLng) {
              if (activeProtectors && activeProtectors.length > 0) {
                startLat = activeProtectors[0].lastLocation?.lat || activeProtectors[0].lat || activeProtectors[0].latitude;
                startLng = activeProtectors[0].lastLocation?.lng || activeProtectors[0].lng || activeProtectors[0].longitude;
              }
            }

            // 3. Ultimate Fallback (Browser GPS/IP)
            if (startLat && startLng) {
              executeTacticalNavigation(startLat, startLng);
            } else {
              const handleGeolocationFallback = async () => {
                try {
                  const res = await fetch('https://ipapi.co/json/');
                  const data = await res.json();
                  if (data && data.latitude && data.longitude) {
                    executeTacticalNavigation(data.latitude, data.longitude);
                    return;
                  }
                } catch (err) { }
                // Ultimate default to Delhi if even IP fails
                executeTacticalNavigation(28.6139, 77.2090);
              };

              const isDefaultPos = userPos && Math.abs(userPos.lat - 20.5937) < 0.001 && Math.abs(userPos.lng - 78.9629) < 0.001;
              if (userPos && userPos.length === 2 && !isDefaultPos) {
                executeTacticalNavigation(userPos.lat, userPos.lng);
              } else if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => executeTacticalNavigation(pos.coords.latitude, pos.coords.longitude),
                  handleGeolocationFallback,
                  { enableHighAccuracy: true, timeout: 5000 }
                );
              } else {
                handleGeolocationFallback();
              }
            }
          } catch (e) {
            console.warn("Failed to execute tactical navigation", e);
          }
        }
      } else if (journey) {
        const lat = journey.latitude || journey.lat || journey.lastLat || journey.currentLat || journey.location?.latitude || journey.location?.lat;
        const lng = journey.longitude || journey.lng || journey.lastLng || journey.currentLng || journey.long || journey.location?.longitude || journey.location?.lng;

        if (lat && lng && typeof mapRef.current.flyTo === 'function') {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 2000 });
        }

        // 🛣️ Draw safe ride navigation route if destination coords are present!
        const destLat = journey.targetCoords?.[1] || journey.destLat || journey.destinationLatitude;
        const destLng = journey.targetCoords?.[0] || journey.destLng || journey.destinationLongitude;

        if (lat && lng && destLat && destLng) {
          fetchRouteMappls(lng, lat, destLng, destLat)
            .then((coords) => {
              if (coords && coords.length > 0 && mapRef.current) {
                const geojsonData = {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: coords
                  }
                };

                if (mapRef.current.getSource('tactical-route-source')) {
                  mapRef.current.getSource('tactical-route-source').setData(geojsonData);
                } else {
                  mapRef.current.addSource('tactical-route-source', { type: 'geojson', data: geojsonData });
                  mapRef.current.addLayer({
                    id: 'tactical-route-line',
                    type: 'line',
                    source: 'tactical-route-source',
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round'
                    },
                    paint: {
                      'line-color': '#0EA5E9',
                      'line-width': 6,
                      'line-opacity': 0.9
                    }
                  });
                }
              }
            })
            .catch((err) => {
              console.warn("Failed to fetch journey route:", err);
            });
        }
      }
    } else if (!selectedAlertId) {
      // Clear route source if it exists when selection is cleared
      if (isLoaded && mapRef.current && mapRef.current.getSource && mapRef.current.getSource('tactical-route-source')) {
        try {
          mapRef.current.getSource('tactical-route-source').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
        } catch (e) {}
      }
    }

    prevSelectedAlertIdRef.current = selectedAlertId || null;
  }, [selectedAlertId, activeAlerts, activeJourneys, isLoaded, userPos]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    const activeIds = [
      ...activeAlerts.map(a => a.id),
      ...activeProtectors.map(p => p.id || p.uid),
      ...activeJourneys.map(j => j.id)
    ];

    Object.keys(markersRef.current).forEach(id => {
      const baseId = id.replace('_polygon', '');
      if (!activeIds.includes(baseId)) {
        try {
          if (markersRef.current[id].remove) {
            markersRef.current[id].remove();
          } else if (Mappls && Mappls.remove) {
            Mappls.remove({ map: mapRef.current, layer: markersRef.current[id] });
          }
        } catch (e) { }
        delete markersRef.current[id];
      }
    });

    // Render Alerts
    activeAlerts.forEach(alert => {
      const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
      const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
      const eloc = alert.mapplsId || alert.mappls_id;
      if (!lat || !lng) return;

      const isSelected = selectedAlertId === alert.id;
      const html = isSelected ? `<div class="pulse-marker-victim"></div>` : `<div style="
        width: 16px; 
        height: 16px; 
        background: #EF4444; 
        border: 2px solid white; 
        border-radius: 50%; 
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
      "></div>`;

      const position = eloc ? { eloc: eloc } : { lat, lng };

      if (!markersRef.current[alert.id]) {
        markersRef.current[alert.id] = new Mappls.Marker({
          map: mapRef.current,
          position: position,
          html: html,
          width: isSelected ? 40 : 16,
          height: isSelected ? 40 : 16,
          offset: isSelected ? [20, 20] : [8, 8]
        });
      } else {
        markersRef.current[alert.id].setPosition(position);
        markersRef.current[alert.id].setIcon(html); // Update HTML just in case selection changes
      }

      // ✨ CONTINUOUS TARGET LOCK (GeoJSON Polygon updates dynamically if victim runs)
      if (lat && lng && mapRef.current) {
        const sourceId = `target-source-${alert.id}`;

        const updateBuildingHighlight = () => {
          if (!mapRef.current) return;
          try {
            let highlightGeometry = null;

            if (mapRef.current.project && typeof mapRef.current.queryRenderedFeatures === 'function') {
              try {
                const pt = mapRef.current.project([lng, lat]);
                // Use a small 4x4 bounding box instead of a 1px strict point to guarantee building hit
                const bbox: any = [[pt.x - 2, pt.y - 2], [pt.x + 2, pt.y + 2]];
                const features = mapRef.current.queryRenderedFeatures(bbox);

                // Look for a building footprint, explicitly EXCLUDING our own target layer!
                const buildingFeature = features.find((f: any) => {
                  if (!f.layer || !f.layer.id) return false;
                  const layerId = f.layer.id.toLowerCase();
                  const sourceLayer = f.sourceLayer ? f.sourceLayer.toLowerCase() : '';

                  // 1. NEVER match our own overlays! This caused the diamond bug.
                  if (layerId.includes('target-layer') || layerId.includes('route') || layerId.includes('kml')) return false;

                  // 2. Strict check for actual buildings to prevent giant neighborhood polygons!
                  return (
                    f.layer.type === 'fill-extrusion' ||
                    layerId.includes('building') ||
                    sourceLayer.includes('building') ||
                    layerId.includes('structure') ||
                    sourceLayer.includes('structure')
                  );
                });

                if (buildingFeature && buildingFeature.geometry) {
                  highlightGeometry = buildingFeature.geometry;
                }
              } catch (e) { }
            }

            const polygonData: any = {
              "type": "FeatureCollection",
              "features": highlightGeometry ? [
                {
                  "type": "Feature",
                  "geometry": highlightGeometry,
                  "properties": {}
                }
              ] : []
            };

            if (mapRef.current.getSource && mapRef.current.addSource) {
              if (mapRef.current.getSource(sourceId)) {
                // Smoothly update the position WITHOUT deleting the layer
                mapRef.current.getSource(sourceId).setData(polygonData);
              } else {
                // Create the source and layer for the first time
                mapRef.current.addSource(sourceId, { type: 'geojson', data: polygonData });

                mapRef.current.addLayer({
                  id: `target-layer-fill-${alert.id}`,
                  type: 'fill',
                  source: sourceId,
                  paint: {
                    'fill-color': '#EF4444',
                    'fill-opacity': 0.3
                  }
                });

                mapRef.current.addLayer({
                  id: `target-layer-line-${alert.id}`,
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
            console.error("Smooth GeoJSON highlight error:", e);
          }
        };

        // 1. Try to highlight immediately
        updateBuildingHighlight();

        // 2. Try again after 1600ms (Guarantee execution AFTER map finishes flyTo animation & loads new vector tiles)
        setTimeout(updateBuildingHighlight, 1600);
      }
    });

    // Render Protectors
    activeProtectors.forEach(p => {
      const lat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
      const lng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      if (!lat || !lng) return;

      const pid = p.id || p.uid;
      const heading = p.heading || p.course || p.lastHeading || 0;
      const html = `
        <div id="car-rotator-${pid}" class="police-car-container" style="transform: rotate(${heading}deg);">
          <div class="police-beacon"></div>
          <svg viewBox="0 0 100 100" class="police-car-svg">
            <rect x="30" y="10" width="40" height="80" rx="15" fill="#1E3A8A" stroke="#FFFFFF" stroke-width="3"/>
            <rect x="35" y="30" width="30" height="35" rx="5" fill="#0284C7"/>
            <rect x="26" y="20" width="4" height="15" rx="2" fill="#000000"/>
            <rect x="70" y="20" width="4" height="15" rx="2" fill="#000000"/>
            <rect x="26" y="65" width="4" height="15" rx="2" fill="#000000"/>
            <rect x="70" y="65" width="4" height="15" rx="2" fill="#000000"/>
            <path d="M 35 15 L 65 15" stroke="#FBBF24" stroke-width="4"/>
          </svg>
        </div>
      `;

      if (!markersRef.current[pid]) {
        markersRef.current[pid] = new Mappls.Marker({
          map: mapRef.current,
          position: { lat, lng },
          html: html,
          width: 46,
          height: 46,
          offset: [23, 23]
        });
      } else {
        markersRef.current[pid].setPosition({ lat, lng });
        markersRef.current[pid].setIcon(html);
      }
    });

    // Render Active Journeys
    activeJourneys.forEach(journey => {
      if (journey.status === 'completed' || journey.status === 'resolved') return;
      const lat = journey.latitude || journey.lat || journey.lastLat || journey.currentLat || journey.location?.latitude || journey.location?.lat;
      const lng = journey.longitude || journey.lng || journey.lastLng || journey.currentLng || journey.long || journey.location?.longitude || journey.location?.lng;
      if (!lat || !lng) return;

      const isSelected = selectedAlertId === journey.id || selectedAlertId === journey.userId;
      const html = isSelected ? `
        <div class="pulse-marker-transit"></div>
      ` : `
        <div style="
          width: 20px; 
          height: 20px; 
          background: #0EA5E9; 
          border: 2px solid white; 
          border-radius: 50%; 
          box-shadow: 0 0 15px rgba(14, 165, 233, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 10px;
        ">🚗</div>
      `;

      if (!markersRef.current[journey.id]) {
        const marker = new Mappls.Marker({
          map: mapRef.current,
          position: { lat, lng },
          html: html,
          width: isSelected ? 44 : 20,
          height: isSelected ? 44 : 20,
          offset: isSelected ? [22, 22] : [10, 10]
        });
        marker.addListener('click', () => {
          if (onAlertClick) onAlertClick(journey.id);
        });
        markersRef.current[journey.id] = marker;
      } else {
        markersRef.current[journey.id].setPosition({ lat, lng });
        markersRef.current[journey.id].setIcon(html);
      }
    });

    // Handle Paths (Victim Path & Protector Path)
    if (polylineRef.current) {
      polylineRef.current.forEach((line: any) => {
        try {
          if (typeof line.remove === 'function') {
            line.remove();
          } else if (typeof line.setMap === 'function') {
            line.setMap(null);
          } else if ((window as any).mappls && typeof (window as any).mappls.remove === 'function') {
            (window as any).mappls.remove({ map: mapRef.current, layer: line });
          }
        } catch (e) {
          console.warn("Failed to remove polyline", e);
        }
      });
      polylineRef.current = [];
    } else {
      polylineRef.current = [];
    }

    if (victimPath && victimPath.length > 0) {
      const vpathCoords = victimPath.map((p: any) => ({ lat: p.lat || p.latitude, lng: p.lng || p.longitude }));
      const vLine = new Mappls.Polyline({
        map: mapRef.current,
        path: vpathCoords,
        strokeColor: '#EF4444',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        lineDasharray: [2, 4]
      });
      polylineRef.current.push(vLine);
    }

    if (protectorPath && protectorPath.length > 0) {
      const ppathCoords = protectorPath.map((p: any) => ({ lat: p.lat || p.latitude, lng: p.lng || p.longitude }));
      const pLine = new Mappls.Polyline({
        map: mapRef.current,
        path: ppathCoords,
        strokeColor: '#06B6D4',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        lineDasharray: [2, 4]
      });
      polylineRef.current.push(pLine);
    }

  }, [activeAlerts, activeProtectors, activeJourneys, selectedAlertId, isLoaded, victimPath, protectorPath, onAlertClick]);

  // 🎯 HUD FOCUS CONTROLS
  const handleFocusBase = () => {
    setIsCockpitMode(true); // Enable continuous tracking

    let carLat: number | null = null;
    let carLng: number | null = null;

    // 1. Try to lock onto the specific responder for the selected mission
    if (selectedAlertId) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      if (alert?.activeResponders?.length > 0) {
        carLat = alert.activeResponders[0].lastLocation?.lat || alert.activeResponders[0].lat || alert.activeResponders[0].latitude;
        carLng = alert.activeResponders[0].lastLocation?.lng || alert.activeResponders[0].lng || alert.activeResponders[0].longitude;
      }
    }

    // 2. Lock onto the blue Command Center car if it exists
    if (!carLat || !carLng) {
      if (commandCenterMarkerRef.current && typeof commandCenterMarkerRef.current.getPosition === 'function') {
        const pos = commandCenterMarkerRef.current.getPosition();
        if (pos) {
          carLat = pos.lat;
          carLng = pos.lng;
        }
      }
    }

    // 3. If no mission is selected, but there are police cars on the map, lock onto the first police car
    if (!carLat || !carLng) {
      if (activeProtectors && activeProtectors.length > 0) {
        const p = activeProtectors[0];
        carLat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
        carLng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      }
    }

    const flyToTarget = (lat: number, lng: number) => {
      if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 19, duration: 1500, pitch: 0, bearing: headingRef.current || 0 });
      }
    };

    if (carLat && carLng) {
      flyToTarget(carLat, carLng);
    } else {
      // 4. Ultimate fallback to live location or default
      const isDefaultPos = userPos && Math.abs(userPos.lat - 20.5937) < 0.001 && Math.abs(userPos.lng - 78.9629) < 0.001;
      if (userPos && userPos.length === 2 && !isDefaultPos) {
        flyToTarget(userPos.lat, userPos.lng);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => flyToTarget(pos.coords.latitude, pos.coords.longitude),
          () => { },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
  };

  const handleFocusTarget = () => {
    if (!mapRef.current || !selectedAlertId) return;
    setIsCockpitMode(false); // Disable cockpit if looking at target
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert) return;
    const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
    const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
    const eloc = alert.mapplsId || alert.mappls_id;

    // ✨ Target Locked Mode: High zoom with 2D tilt
    if (typeof mapRef.current.flyTo === 'function') {
      if (lat && lng) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 20, duration: 1500, pitch: 0, bearing: 45 });
      } else if (eloc) {
        mapRef.current.flyTo({ center: eloc, zoom: 20, duration: 1500, pitch: 0, bearing: 45 });
      }
    }
  };

  // Turn off Cockpit mode if user manually pans map
  useEffect(() => {
    if (mapRef.current && isCockpitMode) {
      const handleMove = (e: any) => {
        if (e.originalEvent) setIsCockpitMode(false); // Map moved by user action
      };
      mapRef.current.on('dragstart', handleMove);
      return () => {
        if (mapRef.current) mapRef.current.off('dragstart', handleMove);
      };
    }
  }, [isCockpitMode]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-[#050505]">
      <style>{`
        .pulse-marker-victim {
          width: 20px; height: 20px;
          background: #EF4444; border: 3px solid white;
          border-radius: 50%; position: relative;
          box-shadow: 0 0 10px rgba(239,68,68,0.8);
          margin: 10px;
        }
        .pulse-marker-victim::after {
          content: ''; position: absolute;
          top: -15px; left: -15px; right: -15px; bottom: -15px;
          border-radius: 50%; border: 2px solid rgba(239,68,68,0.8);
          animation: radarPulse 1s ease-out infinite;
        }
        @keyframes radarPulse {
          0% { transform: scale(0.5); opacity: 1; border-width: 4px; }
          100% { transform: scale(2); opacity: 0; border-width: 1px; }
        }
        .pulse-marker-transit {
          width: 20px; height: 20px;
          background: #0EA5E9; border: 3px solid white;
          border-radius: 50%; position: relative;
          box-shadow: 0 0 15px rgba(14,165,233,0.9);
          margin: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-marker-transit::after {
          content: '🚗';
          font-size: 10px;
        }
        .pulse-marker-transit::before {
          content: ''; position: absolute;
          top: -15px; left: -15px; right: -15px; bottom: -15px;
          border-radius: 50%; border: 2px solid rgba(14,165,233,0.8);
          animation: radarPulseTransit 1.5s ease-out infinite;
        }
        @keyframes radarPulseTransit {
          0% { transform: scale(0.5); opacity: 1; border-width: 4px; }
          100% { transform: scale(2); opacity: 0; border-width: 1px; }
        }
        .police-car-container {
          position: relative;
          width: 100%; height: 100%;
          transition: transform 0.2s linear;
        }
        .police-car-svg {
          width: 100%; height: 100%;
          filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.6));
        }
        .police-beacon {
          position: absolute;
          top: 45%; left: 50%;
          transform: translate(-50%, -50%);
          width: 14px; height: 6px;
          border-radius: 3px;
          background: linear-gradient(90deg, #EF4444 50%, #3B82F6 50%);
          animation: flashingSiren 0.15s infinite linear;
          box-shadow: 0 0 20px rgba(239,68,68,1);
        }
        @keyframes flashingSiren {
          0%, 100% { background: linear-gradient(90deg, #EF4444 50%, #3B82F6 50%); filter: brightness(1.6); }
          50% { background: linear-gradient(90deg, #3B82F6 50%, #EF4444 50%); filter: brightness(1.2); }
        }
        /* Hide ALL native Mappls UI Controls permanently so they don't break */
        [class*="ctrl-top"], [class*="ctrl-bottom"], [class*="control-container"],
        .mappls-ctrl, .mapboxgl-ctrl, .mmi-ctrl, .mappls-control,
        [title="Map layers"], [title="Map Layers"] { 
          display: none !important; 
        }
        /* Completely hide Mappls tracking default bike/car icon */
        img[src*="ccp"], img[src*="bike"], img[src*="car"], img[src*="scooter"] {
          display: none !important;
        }
        /* 🚫 Hide ONLY the ugly Green Start/End Markers via precise CSS */
        div[title="Start"], div[title="End"], 
        .mappls-marker[style*="marker.png"], 
        .mapboxgl-marker[style*="marker.png"],
        .mapboxgl-popup, .mappls-popup {
          display: none !important;
        }
        /* Hidden native boxes to preserve HUD */
        .mappls-direction-box, .mappls-direction-step-container, 
        .mappls-direction-header, .mappls-direction-summary, .mappls-routing-box { 
          display: none !important; 
        }
      `}</style>
      <div id={mapId} className="absolute inset-0 w-full h-full" />

      {/* 🎯 MINIMAL NAVIGATION HUD (Like MapmyIndia Native) */}
      {routeInfo && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
          <div className="bg-white rounded-[32px] px-2 py-2 flex items-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] min-w-[320px] justify-between border border-gray-100">

            {/* Placeholder to keep center alignment */}
            <div className="w-12 h-12"></div>

            {/* ETA & Info */}
            <div className="flex flex-col items-center justify-center px-4">
              <span className="text-red-600 text-[26px] font-bold leading-none tracking-tight mb-1">
                {routeInfo.fetchTime
                  ? Math.max(0, Math.ceil((routeInfo.duration * 1000 - (now - routeInfo.fetchTime)) / 60000))
                  : Math.ceil(routeInfo.duration / 60)
                } min
              </span>
              <span className="text-gray-900 text-base font-medium">
                {(routeInfo.distance / 1000).toFixed(1)} km <span className="mx-1 text-gray-500">•</span> {
                  new Date((routeInfo.fetchTime || Date.now()) + routeInfo.duration * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                }
              </span>
            </div>

            {/* Route Icon */}
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="19" r="3" />
                <path d="M16 8l-5 4 4 4-5 3" />
              </svg>
            </div>

          </div>
        </div>
      )}

      {/* 🎯 TACTICAL HUD CONTROLS */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">

        {/* Satellite Toggle Removed */}


        <button
          onClick={handleFocusBase}
          className={cn(
            "w-12 h-12 backdrop-blur-md border rounded-full flex items-center justify-center transition-all group relative",
            isCockpitMode
              ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse"
              : "bg-gray-900/80 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          )}
          title="Cockpit Lock"
        >
          <Navigation className="w-5 h-5" />
          <div className="absolute right-14 bg-black/80 px-3 py-2 rounded text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-cyan-500/30 text-cyan-300">
            {isCockpitMode ? 'Cockpit Locked' : 'Cockpit Mode'}
          </div>
        </button>

        {selectedAlertId && (
          <button
            onClick={handleFocusTarget}
            className="w-12 h-12 bg-gray-900/80 backdrop-blur-md border border-red-500/50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:scale-110 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] group relative"
            title="Lock Target"
          >
            <LocateFixed className="w-5 h-5" />
            <div className="absolute right-14 bg-black/80 px-3 py-2 rounded text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-red-500/30 text-red-400">
              Lock Target
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
