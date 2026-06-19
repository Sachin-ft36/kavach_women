import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useKavachStore } from '../../../store/useKavachStore';
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
  onVictimClick?: () => void
) {
  const { role } = useKavachStore();
  const activeAlert = activeAlerts.find(a => a.status === 'active' || a.status === 'responding');
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
          m.setZoom(19);
        }
      }
    }
  }, [activePos, activeAlerts, map, markersRef, isMapLoaded, isNavigating, isCarHUD, isAutoTracking, onVictimClick, responderPos, role]);
}
