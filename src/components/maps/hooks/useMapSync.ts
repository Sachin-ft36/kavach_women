import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePCRTelemetryStore } from '../../../hooks/usePCRTelemetryStore';

export function useMapSync(
  map: React.MutableRefObject<mapboxgl.Map | null>,
  markersRef: React.MutableRefObject<any>,
  isMapLoaded: boolean,
  mapStyle: 'streets' | 'satellite' | 'dark',
  activePos: [number, number] | null,
  isNavigating: boolean,
  isInterceptMode: boolean,
  metrics: any,
  setIsMapLoaded: (loaded: boolean) => void,
  isCarHUD?: boolean,
  isProtectorHUD?: boolean
) {
  const currentStyleRef = useRef<'streets' | 'satellite' | 'dark'>('streets');

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
    coords.push(coords[0]);
    return [coords];
  };

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    if (currentStyleRef.current === mapStyle) return;

    let styleUrl = 'mapbox://styles/mapbox/streets-v12';
    if (mapStyle === 'satellite') {
      styleUrl = 'mapbox://styles/mapbox/satellite-streets-v12';
    } else if (mapStyle === 'dark') {
      styleUrl = 'mapbox://styles/mapbox/dark-v11';
    }

    if (markersRef.current.user) { markersRef.current.user.remove(); delete markersRef.current.user; }
    if (markersRef.current.victim) { markersRef.current.victim.remove(); delete markersRef.current.victim; }

    currentStyleRef.current = mapStyle;
    setIsMapLoaded(false);
    map.current.setStyle(styleUrl);
  }, [mapStyle, isMapLoaded, map, markersRef, setIsMapLoaded]);

  useEffect(() => {
    if (!map.current || !activePos || !isMapLoaded) return;
    const coords: [number, number] = [activePos[1], activePos[0]];

    if (map.current.getSource('safety-radius')) {
      if (isInterceptMode) {
        if (map.current.getLayer('safety-radius-fill')) map.current.setLayoutProperty('safety-radius-fill', 'visibility', 'none');
        if (map.current.getLayer('safety-radius-outline')) map.current.setLayoutProperty('safety-radius-outline', 'visibility', 'none');
      } else {
        if (map.current.getLayer('safety-radius-fill')) {
          map.current.setLayoutProperty('safety-radius-fill', 'visibility', 'visible');
          const color = metrics.level === 'OPTIMAL' ? '#10B981' : metrics.level === 'CAUTION' ? '#F59E0B' : '#EF4444';
          map.current.setPaintProperty('safety-radius-fill', 'fill-color', color);
        }
        if (map.current.getLayer('safety-radius-outline')) {
          map.current.setLayoutProperty('safety-radius-outline', 'visibility', 'visible');
          const color = metrics.level === 'OPTIMAL' ? '#10B981' : metrics.level === 'CAUTION' ? '#F59E0B' : '#EF4444';
          map.current.setPaintProperty('safety-radius-outline', 'line-color', color);
        }

        (map.current.getSource('safety-radius') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: getCirclePoints(coords, 0.5)
          },
          properties: {}
        });
      }
    }

    if (!markersRef.current.user) {
      const el = document.createElement('div');
      el.className = 'user-pos-marker';
      
      let markerHtml = `<div style="width: 16px; height: 16px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);"></div>`;
      
      if (isCarHUD) {
        markerHtml = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; pointer-events: auto; transform: rotate(${(window as any)._last_calculated_bearing || 0}deg);">
                 <div style="width: 32px; height: 32px; background: #0284c7; border: 2.5px solid white; border-radius: 50%; display: flex; items-center; justify-content: center; font-size: 18px; box-shadow: 0 0 15px rgba(2, 132, 199, 0.7); line-height: 28px; text-align: center;">🚔</div>
               </div>`;
      } else if (isProtectorHUD) {
        markerHtml = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; pointer-events: auto; transform: rotate(${(window as any)._last_calculated_bearing || 0}deg);">
                 <div style="width: 32px; height: 32px; background: #059669; border: 2.5px solid white; border-radius: 50%; display: flex; items-center; justify-content: center; font-size: 18px; box-shadow: 0 0 15px rgba(5, 150, 105, 0.7); line-height: 28px; text-align: center;">🏍️</div>
               </div>`;
      }
      
      el.innerHTML = markerHtml;

      markersRef.current.user = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(map.current);
    } else {
      markersRef.current.user.setLngLat(coords);
    }

    const speedVal = isNavigating ? Math.floor(75 + Math.random() * 20) : 0;
    const bearingVal = (window as any)._last_calculated_bearing || Math.floor(Math.random() * 360);
    usePCRTelemetryStore.getState().updateVehiclePosition(
      activePos[0],
      activePos[1],
      speedVal,
      bearingVal
    );

    if (isNavigating) {
      map.current.setCenter(coords);
      map.current.setZoom(19);
    }
  }, [activePos, isNavigating, isMapLoaded, map, markersRef, isInterceptMode, metrics.level]);
}
