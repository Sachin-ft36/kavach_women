import React, { useEffect, useRef, memo, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../store/useKavachStore';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ShieldCheck, ShieldAlert, Navigation } from 'lucide-react';

// MAPBOX ACCESS TOKEN: RESTORED
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

import { useSafetyIntelligence } from '../../hooks/useSafetyIntelligence';

const SecurityRadarMap = memo(({ protectors = [], activeRadius = 1.0 }: { protectors?: any[], activeRadius?: number }) => {
  const { userPos, activeAlertId, isSOSActive } = useKavachStore();
  const metrics = useSafetyIntelligence();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{user?: mapboxgl.Marker, responders: { [key: string]: mapboxgl.Marker }, police: mapboxgl.Marker[], radar?: mapboxgl.Marker, route?: mapboxgl.Marker}>({ responders: {}, police: [] });
  const [responderId, setResponderId] = useState<string | null>(null);
  const fetchedPoliceCoords = useRef<{ lat: number, lng: number } | null>(null);

  // 📡 LISTEN FOR RESPONDER HANDSHAKE
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
    if (!mapContainer.current) return;

    // Mapbox expects [lng, lat]
    const initialCoords: [number, number] = userPos ? [userPos[1], userPos[0]] : [78.9629, 20.5937];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCoords,
      zoom: 14.5, // 🛰️ TACTICAL ZOOM: Locked for 1km clarity
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });

    map.current.on('load', () => {
      console.log("🛰️ RADAR GRID: Mapbox Satellite Lock Established.");
      if (map.current) {
        map.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        // 🛡️ INITIALIZE 1KM RADIUS SOURCE
        map.current.addSource('radar-radius', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} }
        });

        // 🎨 RADIUS FILL (TINTED)
        map.current.addLayer({
          id: 'radar-radius-fill',
          type: 'fill',
          source: 'radar-radius',
          paint: {
            'fill-color': '#0A84FF',
            'fill-opacity': 0.1
          }
        });

        // 🎨 RADIUS OUTLINE (SHARP)
        map.current.addLayer({
          id: 'radar-radius-outline',
          type: 'line',
          source: 'radar-radius',
          paint: {
            'line-color': '#0A84FF',
            'line-width': 2,
            'line-opacity': 0.5,
            'line-dasharray': [2, 1]
          }
        });
      }
    });

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  // 🛰️ HELPER: GENERATE 1KM CIRCLE POLYGON
  const getCirclePoints = (center: [number, number], radiusKm: number) => {
    const points = 64;
    const coords = [];
    const distanceX = radiusKm / (111.32 * Math.cos(center[1] * Math.PI / 180));
    const distanceY = radiusKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center[0] + x, center[1] + y]);
    }
    coords.push(coords[0]); // Close the polygon
    return [coords];
  };

  // 🛰️ USER POSITION & RADIUS SYNC
  useEffect(() => {
    const m = map.current;
    if (!m || !userPos) return;

    const coords: [number, number] = [userPos[1], userPos[0]];

    // 🛡️ DYNAMIC FRAME: Fit map based on the ACTIVE radius
    const offset = (activeRadius * 0.011) + 0.003; 
    const bounds = new mapboxgl.LngLatBounds()
      .extend([coords[0] - offset, coords[1] - offset])
      .extend([coords[0] + offset, coords[1] + offset]);

    m.fitBounds(bounds, {
      padding: 50,
      duration: 2000,
      essential: true
    });

    // 🛡️ ENSURE TACTICAL LAYERS EXIST (Robust Load for 5 Layers)
    const ensureLayers = () => {
      const tiers = [1, 2, 3, 4, 5];
      tiers.forEach(tier => {
        const sourceId = `radar-radius-${tier}`;
        if (!m.getSource(sourceId)) {
          m.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} }
          });

          const isActive = tier === activeRadius;
          const color = metrics.level === 'OPTIMAL' ? '#10B981' : metrics.level === 'CAUTION' ? '#F59E0B' : metrics.level === 'CRITICAL' ? '#EF4444' : '#0A84FF';

          m.addLayer({
            id: `${sourceId}-fill`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': color,
              'fill-opacity': isActive ? 0.1 : 0.02
            }
          });

          m.addLayer({
            id: `${sourceId}-outline`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': isActive ? 3 : 1,
              'line-opacity': isActive ? 0.8 : 0.2,
              'line-dasharray': isActive ? [] : [2, 4]
            }
          });
        } else {
          // 📡 DYNAMIC STYLE UPDATE: Highlight the active tier
          const isActive = tier === activeRadius;
          const color = metrics.level === 'OPTIMAL' ? '#10B981' : metrics.level === 'CAUTION' ? '#F59E0B' : metrics.level === 'CRITICAL' ? '#EF4444' : '#0A84FF';
          
          m.setPaintProperty(`${sourceId}-fill`, 'fill-color', color);
          m.setPaintProperty(`${sourceId}-fill`, 'fill-opacity', isActive ? 0.1 : 0.02);
          m.setPaintProperty(`${sourceId}-outline`, 'line-color', color);
          m.setPaintProperty(`${sourceId}-outline`, 'line-width', isActive ? 3 : 1);
          m.setPaintProperty(`${sourceId}-outline`, 'line-opacity', isActive ? 0.8 : 0.2);
          m.setPaintProperty(`${sourceId}-outline`, 'line-dasharray', isActive ? [] : [2, 4]);
        }
      });
    };

    const updateCircles = () => {
      [1, 2, 3, 4, 5].forEach(tier => {
        const source = m.getSource(`radar-radius-${tier}`) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: getCirclePoints(coords, tier)
            },
            properties: {}
          });
        }
      });
    };

    if (m.isStyleLoaded()) {
      ensureLayers();
      updateCircles();
    } else {
      m.once('idle', () => {
        ensureLayers();
        updateCircles();
      });
    }

    if (!markersRef.current.user) {
      const el = document.createElement('div');
      el.className = 'victim-marker';
      el.innerHTML = `<div style="background: #FFF; width: 12px; height: 12px; border-radius: 50%; border: 3px solid #0A84FF; box-shadow: 0 0 15px #0A84FF;"></div>`;
      markersRef.current.user = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(m);
    } else {
      markersRef.current.user.setLngLat(coords);
    }

    // 🚔 FETCH REAL POLICE STATIONS VIA OVERPASS API (Once per significant location change)
    const fetchPoliceStations = async () => {
      const dist = fetchedPoliceCoords.current ? calculateDistance(userPos[0], userPos[1], fetchedPoliceCoords.current.lat, fetchedPoliceCoords.current.lng) : 999;
      // Only re-fetch if user moved more than 2KM
      if (dist < 2.0) return; 

      fetchedPoliceCoords.current = { lat: userPos[0], lng: userPos[1] };
      console.log("🚔 RADAR: Scanning for real Police Stations...");

      try {
        const searchRadius = activeRadius * 1000; // meters
        const query = `
          [out:json];
          (
            node["amenity"="police"](around:${searchRadius},${userPos[0]},${userPos[1]});
            way["amenity"="police"](around:${searchRadius},${userPos[0]},${userPos[1]});
            relation["amenity"="police"](around:${searchRadius},${userPos[0]},${userPos[1]});
          );
          out center;
        `;
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await res.json();

        // Clear old police markers
        markersRef.current.police.forEach(marker => marker.remove());
        markersRef.current.police = [];

        data.elements.forEach((station: any) => {
          const lat = station.lat || station.center?.lat;
          const lon = station.lon || station.center?.lon;
          if (lat && lon && map.current) {
            const el = document.createElement('div');
            el.className = 'police-marker';
            el.style.cursor = 'pointer';
            el.style.zIndex = '800'; // Below Elite protectors, above standard
            el.innerHTML = `
              <div style="background: #1e3a8a; padding: 6px; border-radius: 10px; border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(59,130,246,0.5);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
            `;
            
            const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'police-popup' })
              .setHTML(`
                <div style="padding: 4px; font-family: sans-serif;">
                  <h3 style="color: black; font-weight: 900; margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${station.tags?.name || 'Police Station'}</h3>
                  <p style="color: #666; font-size: 9px; margin: 2px 0 0 0; font-weight: bold; text-transform: uppercase;">Verified Station</p>
                </div>
              `);

            const marker = new mapboxgl.Marker(el)
              .setLngLat([lon, lat])
              .setPopup(popup)
              .addTo(map.current);
            
            markersRef.current.police.push(marker);
          }
        });
        console.log(`🚔 RADAR: Mapped ${data.elements.length} Police Stations.`);
      } catch (e) {
        console.error("Failed to fetch police stations", e);
      }
    };

    if (m.isStyleLoaded()) {
      fetchPoliceStations();
    } else {
      m.once('idle', fetchPoliceStations);
    }
  }, [userPos, activeRadius]);

  // HELPER FOR DISTANCE CHECK
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // 3. Protector Grid Rendering
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const activeIds = protectors.map(p => p.id || p.uid);
    Object.keys(markersRef.current.responders).forEach(id => {
      if (!activeIds.includes(id)) {
        markersRef.current.responders[id].remove();
        delete markersRef.current.responders[id];
      }
    });

    protectors.forEach(p => {
      const lat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.coords?.[0];
      const lng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.coords?.[1];
      if (!lat || !lng) return;
      const pid = p.id || p.uid;
      
      const isResponder = pid === responderId;
      
      // 🎖️ ELITE STATUS DETECTION (Army, Police, Ex-Servicemen)
      const occupation = p.protectorVetting?.occupation || p.profession || '';
      const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some(role => 
        occupation.toLowerCase().includes(role.toLowerCase())
      );

      // 🎨 TACTICAL COLOR SCHEME: Gold for Elite, Blue for Standard
      const markerColor = isElite ? '#F59E0B' : (isResponder ? '#10B981' : '#0A84FF');
      const markerGlow = isElite ? '#F59E0B' : (isResponder ? '#10B981' : '#0A84FF');
      const markerSize = isElite ? '16px' : '12px';

      if (!markersRef.current.responders[pid]) {
        const el = document.createElement('div');
        el.className = 'protector-marker';
        el.style.zIndex = isElite ? '1000' : '500'; // 🛰️ ELEVATION: Elite units stay on top
        el.innerHTML = `
          <div style="
            background: ${markerColor}; 
            width: ${markerSize}; 
            height: ${markerSize}; 
            border-radius: 50%; 
            border: 2px solid white; 
            box-shadow: 0 0 15px ${markerGlow}; 
            ${isResponder ? 'animation: responder-pulse 2s infinite ease-in-out;' : ''}
            ${isElite ? 'animation: elite-pulse 2s infinite ease-in-out;' : ''}
          "></div>
        `;
        markersRef.current.responders[pid] = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(m);
      } else {
        markersRef.current.responders[pid].setLngLat([lng, lat]);
        const el = markersRef.current.responders[pid].getElement();
        el.style.zIndex = isElite ? '1000' : '500';
        const dot = el.firstElementChild as HTMLElement;
        if (dot) {
          dot.style.background = markerColor;
          dot.style.boxShadow = `0 0 15px ${markerGlow}`;
          dot.style.width = markerSize;
          dot.style.height = markerSize;
          dot.style.animation = isResponder ? 'responder-pulse 2s infinite ease-in-out' : (isElite ? 'elite-pulse 2s infinite ease-in-out' : '');
        }
      }
    });
  }, [protectors, responderId]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-[#050505]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Status bars removed for tactical clarity and to prevent overlap with SOS controls */}
      <style>{`
        @keyframes responder-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes elite-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
    </div>
  );
});

export default SecurityRadarMap;
