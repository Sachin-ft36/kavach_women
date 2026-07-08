import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../../state/useKavachStore';
import { fetchRouteMappls } from '../../../services/MapplsService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';

export function useVictimRouteSync(
  map: React.MutableRefObject<mapboxgl.Map | null>,
  markersRef: React.MutableRefObject<any>,
  isMapLoaded: boolean,
  activePos: [number, number] | null,
  activeAlerts: any[],
  isNavigating: boolean,
  isCarHUD: boolean,
  isAutoTracking: React.MutableRefObject<boolean>,
  onVictimClick?: () => void,
  isProtectorHUD?: boolean,
  guardianProtectors?: any[]
) {
  const { role } = useKavachStore();
  const activeAlert = activeAlerts.find(a => a.status === 'active' || a.status === 'responding' || a.status === 'supercell_dispatched' || a.status === 'rescued_pending_victim_clearance');
  const responderUid = activeAlert?.responderUid;
  const [responderPos, setResponderPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!responderUid || role === 'protector') {
      setResponderPos(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', responderUid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lat = data.lastLocation?.lat || data.latitude || data.location?.latitude;
        const lng = data.lastLocation?.lng || data.longitude || data.location?.longitude;
        if (lat && lng) {
          setResponderPos([lat, lng]);
        }
      }
    });
    return () => unsub();
  }, [responderUid, role]);

  useEffect(() => {
    const m = map.current;
    if (!m || !activePos || !isMapLoaded) return;

    if (activeAlert) {
      const vLat = activeAlert.latitude || activeAlert.location?.latitude || activeAlert.location?.lat;
      const vLng = activeAlert.longitude || activeAlert.location?.longitude || activeAlert.location?.lng;

      if (vLat && vLng) {
        let targetLat = vLat;
        let targetLng = vLng;
        
        // Use responderPos as the route start if available and role is not protector
        const routeStartPos = (responderPos && role !== 'protector') ? responderPos : activePos;

        if (Math.abs(targetLat - routeStartPos[0]) < 0.00001 && Math.abs(targetLng - routeStartPos[1]) < 0.00001) {
          targetLat += 0.0005;
          targetLng += 0.0005;
        }
        
        const vCoords: [number, number] = [targetLng, targetLat];
        const uCoords: [number, number] = [routeStartPos[1], routeStartPos[0]];

        if (!markersRef.current.victim) {
          const el = document.createElement('div');
          el.className = 'victim-pos-marker';
          el.innerHTML = `<div style="width: 20px; height: 20px; background: #EF4444; border: 3px solid white; border-radius: 50%; shadow: 0 0 10px rgba(239, 68, 68, 0.4);"></div>`;
          markersRef.current.victim = new mapboxgl.Marker(el)
            .setLngLat(vCoords)
            .addTo(m);
            
          if (onVictimClick) {
            el.addEventListener('click', () => onVictimClick());
            el.style.cursor = 'pointer';
          }
        } else {
          markersRef.current.victim.setLngLat(vCoords);
        }

        const updateMapboxRoute = (coordinates: any[]) => {
          if (!m || !m.isStyleLoaded()) return;
          if (!m.getSource('route')) {
            m.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: coordinates
                }
              }
            });

            m.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': isCarHUD ? '#FF3B30' : '#3B82F6',
                'line-width': 6,
                'line-opacity': 0.8,
                ...(isCarHUD ? { 'line-dasharray': [2, 2] } : {})
              }
            });
          } else {
            (m.getSource('route') as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            });
          }
        };

        const prev = (window as any)._last_mappls_route_coords;
        const uLng = uCoords[0], uLat = uCoords[1];

        let shouldFetch = false;
        if (!prev) {
          shouldFetch = true;
        } else {
          const distSq = Math.pow(uLng - prev.uLng, 2) + Math.pow(uLat - prev.uLat, 2) +
            Math.pow(vLng - prev.vLng, 2) + Math.pow(vLat - prev.vLat, 2);
          if (distSq > 0.0000005) shouldFetch = true;
        }

        if (shouldFetch) {
          (window as any)._last_mappls_route_coords = { uLng, uLat, vLng, vLat };
          fetchRouteMappls(uLng, uLat, vLng, vLat).then(routePath => {
            let finalPath;
            if (routePath && routePath.length > 0) {
              finalPath = [...routePath, vCoords];
            } else {
              finalPath = [uCoords, vCoords];
            }
            updateMapboxRoute(finalPath);
          });
        } else {
          if (!m.getSource('route')) updateMapboxRoute([uCoords, vCoords]);
        }

        if (!isNavigating) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend(uCoords);
          bounds.extend(vCoords);
          m.fitBounds(bounds, { padding: 60, maxZoom: 18, pitch: 45 });
        } else {
          const calculateBearing = (start: [number, number], end: [number, number]) => {
            const toRad = (deg: number) => deg * Math.PI / 180;
            const toDeg = (rad: number) => rad * 180 / Math.PI;
            const lon1 = toRad(start[0]), lat1 = toRad(start[1]);
            const lon2 = toRad(end[0]), lat2 = toRad(end[1]);
            const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
            return (toDeg(Math.atan2(y, x)) + 360) % 360;
          };

          const bearing = calculateBearing(uCoords, vCoords);
          (window as any)._last_calculated_bearing = bearing;
          m.easeTo({
            center: uCoords,
            zoom: 18.5,
            pitch: 65,
            bearing: bearing,
            duration: 1000
          });
        }
      }
    } else {
      if (markersRef.current.victim) { markersRef.current.victim.remove(); delete markersRef.current.victim; }
      if (m.getLayer('route')) m.removeLayer('route');
      if (m.getSource('route')) m.removeSource('route');
      
      const rideData = useKavachStore.getState().rideData;
      if (rideData?.status === 'active') {
        const calculateBearing = (start: [number, number], end: [number, number]) => {
          const toRad = (deg: number) => deg * Math.PI / 180;
          const toDeg = (rad: number) => rad * 180 / Math.PI;
          const lon1 = toRad(start[0]), lat1 = toRad(start[1]);
          const lon2 = toRad(end[0]), lat2 = toRad(end[1]);
          const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
          const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
          return (toDeg(Math.atan2(y, x)) + 360) % 360;
        };

        const prevPos = (window as any)._last_ride_pos;
        const currCoords: [number, number] = [activePos[1], activePos[0]];
        
        if (isAutoTracking.current) {
          if (prevPos && (prevPos[0] !== activePos[0] || prevPos[1] !== activePos[1])) {
            const prevCoords: [number, number] = [prevPos[1], prevPos[0]];
            const bearing = calculateBearing(prevCoords, currCoords);
            
            m.easeTo({
              center: currCoords,
              zoom: 18.5,
              pitch: 65,
              bearing: bearing,
              duration: 1000,
              essential: true
            });
          } else if (!prevPos) {
            m.easeTo({
              center: currCoords,
              zoom: 18.5,
              pitch: 65,
              essential: true
            });
          }
        }
        (window as any)._last_ride_pos = activePos;
      } else {
        if (isAutoTracking.current) {
          m.setCenter([activePos[1], activePos[0]]);
          m.setZoom(14.8);
        }
      }
    }
  }, [activePos, activeAlerts, map, markersRef, isMapLoaded, isNavigating, isCarHUD, isAutoTracking, onVictimClick, responderPos, role]);

  // ════════════════════════════════════════════════════
  //  GUARDIAN TACTICAL OVERLAY
  //  Dark map + SOS pulsing pin + radius ring + protector pins + connector lines
  // ════════════════════════════════════════════════════
  const guardianMarkersRef = React.useRef<mapboxgl.Marker[]>([]);

  // Inject @keyframes for guardian SOS pulse animation once
  useEffect(() => {
    const styleId = 'kavach-guardian-sos-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes guardian-sos-pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.35); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes guardian-sos-core-blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 16px 4px rgba(239,68,68,0.85); }
          50% { opacity: 0.7; box-shadow: 0 0 28px 10px rgba(239,68,68,0.5); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !isMapLoaded || !isProtectorHUD) return;

    const activeAlert = activeAlerts.find(a => a.status === 'active' || a.status === 'responding' || a.status === 'supercell_dispatched' || a.status === 'rescued_pending_victim_clearance');
    
    const GUARDIAN_RADIUS_SRC = 'guardian-sos-radius';
    const GUARDIAN_FILL_ID = 'guardian-sos-fill';
    const GUARDIAN_RING_ID = 'guardian-sos-ring';
    const GUARDIAN_LINES_SRC = 'guardian-protector-lines';
    const GUARDIAN_LINES_ID = 'guardian-protector-lines-layer';

    const cleanTacticalOverlay = () => {
      if (markersRef.current._guardianSOS) {
        markersRef.current._guardianSOS.remove();
        delete markersRef.current._guardianSOS;
      }
      try {
        if (m.getLayer(GUARDIAN_FILL_ID)) m.removeLayer(GUARDIAN_FILL_ID);
        if (m.getLayer(GUARDIAN_RING_ID)) m.removeLayer(GUARDIAN_RING_ID);
        if (m.getSource(GUARDIAN_RADIUS_SRC)) m.removeSource(GUARDIAN_RADIUS_SRC);
        if (m.getLayer(GUARDIAN_LINES_ID)) m.removeLayer(GUARDIAN_LINES_ID);
        if (m.getSource(GUARDIAN_LINES_SRC)) m.removeSource(GUARDIAN_LINES_SRC);
      } catch (err) {
        console.warn("Error cleaning tactical map layers:", err);
      }
      guardianMarkersRef.current.forEach(mk => mk.remove());
      guardianMarkersRef.current = [];
    };

    if (!activeAlert) {
      cleanTacticalOverlay();
      return;
    }

    const sosLat = activeAlert.latitude || activeAlert.location?.lat || activeAlert.coords?.[0];
    const sosLng = activeAlert.longitude || activeAlert.location?.lng || activeAlert.coords?.[1];

    if (!sosLat || !sosLng) return;

    const sosCoords: [number, number] = [sosLng, sosLat];

    // ─── SOS CENTER MARKER ───
    if (!markersRef.current._guardianSOS) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 64px; height: 64px;
        ">
          <div style="
            position: absolute; inset: 0;
            background: rgba(239,68,68,0.22);
            border-radius: 50%;
            animation: guardian-sos-pulse 1.5s ease-out infinite;
          "></div>
          <div style="
            position: absolute; inset: 8px;
            background: rgba(239,68,68,0.15);
            border-radius: 50%;
            animation: guardian-sos-pulse 1.5s ease-out 0.5s infinite;
          "></div>
          <div style="
            position: absolute; inset: 14px;
            background: rgba(239,68,68,0.1);
            border-radius: 50%;
            animation: guardian-sos-pulse 1.5s ease-out 0.9s infinite;
          "></div>
          <div style="
            width: 36px; height: 36px;
            background: #DC2626;
            border: 3px solid #fff;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 9px; font-weight: 900; color: #fff;
            letter-spacing: 0.5px;
            animation: guardian-sos-core-blink 1s ease-in-out infinite;
            position: relative; z-index: 2;
          ">SOS</div>
        </div>`;
      markersRef.current._guardianSOS = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(sosCoords)
        .addTo(m);
    } else {
      markersRef.current._guardianSOS.setLngLat(sosCoords);
    }

    // ─── RADIUS RING (1 km dashed red) ───
    const getCircleCoords = (center: [number, number], radiusKm: number) => {
      const pts = 72;
      const coords: [number, number][] = [];
      const dX = radiusKm / (111.32 * Math.cos(center[1] * Math.PI / 180));
      const dY = radiusKm / 110.574;
      for (let i = 0; i <= pts; i++) {
        const theta = (i / pts) * 2 * Math.PI;
        coords.push([center[0] + dX * Math.cos(theta), center[1] + dY * Math.sin(theta)]);
      }
      return coords;
    };

    if (!m.getSource(GUARDIAN_RADIUS_SRC)) {
      m.addSource(GUARDIAN_RADIUS_SRC, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [getCircleCoords(sosCoords, 1)] },
          properties: {}
        }
      });
      m.addLayer({
        id: GUARDIAN_FILL_ID,
        type: 'fill',
        source: GUARDIAN_RADIUS_SRC,
        paint: { 'fill-color': '#EF4444', 'fill-opacity': 0.07 }
      });
      m.addLayer({
        id: GUARDIAN_RING_ID,
        type: 'line',
        source: GUARDIAN_RADIUS_SRC,
        paint: {
          'line-color': '#EF4444',
          'line-width': 2,
          'line-opacity': 0.7,
          'line-dasharray': [4, 3]
        }
      });
    } else {
      (m.getSource(GUARDIAN_RADIUS_SRC) as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [getCircleCoords(sosCoords, 1)] },
        properties: {}
      });
    }

    // ─── PROTECTOR PINS + CONNECTOR LINES ───
    // Remove old markers
    guardianMarkersRef.current.forEach(mk => mk.remove());
    guardianMarkersRef.current = [];

    const lineFeatures: any[] = [];

    (guardianProtectors || []).slice(0, 8).forEach((p, i) => {
      const pLat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.lastLocation?.latitude || p.latitude;
      const pLng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.lastLocation?.longitude || p.longitude;
      if (!pLat || !pLng) return;

      const pCoords: [number, number] = [pLng, pLat];

      // Green protector marker
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 28px; height: 28px;
          background: #10B981;
          border: 2.5px solid #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 10px rgba(16,185,129,0.6);
          font-size: 13px; line-height: 1;
        ">🧑</div>`;
      const mk = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(pCoords)
        .addTo(m);
      guardianMarkersRef.current.push(mk);

      // Line from protector → SOS center
      lineFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [pCoords, sosCoords]
        },
        properties: { idx: i }
      });
    });

    const linesGeoJSON: any = { type: 'FeatureCollection', features: lineFeatures };

    if (!m.getSource(GUARDIAN_LINES_SRC)) {
      m.addSource(GUARDIAN_LINES_SRC, { type: 'geojson', data: linesGeoJSON });
      m.addLayer({
        id: GUARDIAN_LINES_ID,
        type: 'line',
        source: GUARDIAN_LINES_SRC,
        paint: {
          'line-color': '#10B981',
          'line-width': 2,
          'line-opacity': 0.7,
          'line-dasharray': [3, 2]
        }
      });
    } else {
      (m.getSource(GUARDIAN_LINES_SRC) as mapboxgl.GeoJSONSource).setData(linesGeoJSON);
    }

    // Fit map to show SOS center + all protectors
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend(sosCoords);
    (guardianProtectors || []).forEach(p => {
      const pLat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.lastLocation?.latitude || p.latitude;
      const pLng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.lastLocation?.longitude || p.longitude;
      if (pLat && pLng) bounds.extend([pLng, pLat]);
    });
    m.fitBounds(bounds, { padding: 60, maxZoom: 16.5, pitch: 30, duration: 1200 });

    return () => {
      cleanTacticalOverlay();
    };
  }, [isMapLoaded, isProtectorHUD, activeAlerts, guardianProtectors, activePos]);
}
