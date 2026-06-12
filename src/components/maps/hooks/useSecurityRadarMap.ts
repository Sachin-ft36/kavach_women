import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../../store/useKavachStore';
import { db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useSafetyIntelligence } from '../../../hooks/useSafetyIntelligence';
import { getCirclePoints } from '../utils/mapGeometryUtils';
import { fetchAndMapPoliceStations, calculateDistance } from '../utils/policeStationFetcher';

// MAPBOX ACCESS TOKEN: RESTORED
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

export function useSecurityRadarMap(protectors: any[] = [], activeRadius: number = 1.0) {
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
    const initialCoords: [number, number] = userPos ? [userPos.lng, userPos.lat] : [78.9629, 20.5937];

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
            'fill-opacity': 0.02
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



  // 🛰️ USER POSITION & RADIUS SYNC
  useEffect(() => {
    const m = map.current;
    if (!m || !userPos) return;

    const coords: [number, number] = [userPos.lng, userPos.lat];

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
              'fill-opacity': isActive ? 0.02 : 0.005
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
          m.setPaintProperty(`${sourceId}-fill`, 'fill-opacity', isActive ? 0.02 : 0.005);
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

    // 🚔 FETCH REAL POLICE STATIONS VIA OVERPASS API
    const fetchPoliceStations = async () => {
      const dist = fetchedPoliceCoords.current ? calculateDistance(userPos.lat, userPos.lng, fetchedPoliceCoords.current.lat, fetchedPoliceCoords.current.lng) : 999;
      if (dist < 2.0) return; 

      fetchedPoliceCoords.current = { lat: userPos.lat, lng: userPos.lng };
      await fetchAndMapPoliceStations(map.current!, userPos, activeRadius, markersRef);
    };

    if (m.isStyleLoaded()) {
      fetchPoliceStations();
    } else {
      m.once('idle', fetchPoliceStations);
    }
  }, [userPos, activeRadius]);

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
      
      const occupation = p.protectorVetting?.occupation || p.profession || '';
      const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some(role => 
        occupation.toLowerCase().includes(role.toLowerCase())
      );

      const markerColor = isElite ? '#F59E0B' : (isResponder ? '#10B981' : '#0A84FF');
      const markerGlow = isElite ? '#F59E0B' : (isResponder ? '#10B981' : '#0A84FF');
      const markerSize = isElite ? '16px' : '12px';

      if (!markersRef.current.responders[pid]) {
        const el = document.createElement('div');
        el.className = 'protector-marker';
        el.style.zIndex = isElite ? '1000' : '500'; 
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

  return { mapContainer };
}
