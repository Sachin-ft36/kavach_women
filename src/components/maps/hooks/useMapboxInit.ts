import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePCRTelemetryStore } from '../../../hooks/usePCRTelemetryStore';

export function useMapboxInit(
  map: React.MutableRefObject<mapboxgl.Map | null>,
  mapContainer: React.RefObject<HTMLDivElement>,
  activePos: [number, number] | null,
  setIsMapLoaded: (loaded: boolean) => void,
  isAutoTracking: React.MutableRefObject<boolean>,
  isProtectorHUD?: boolean
) {
  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapboxgl.supported()) {
      console.warn("⚠️ KAVACH: WebGL is not supported on this browser. Map disabled.");
      return;
    }

    if (map.current) return; // Prevent re-initialization if map already exists
    
    mapContainer.current.innerHTML = '';
    const initialCoords: [number, number] = activePos ? [activePos[1], activePos[0]] : [78.9629, 20.5937];
    const initialStyle = isProtectorHUD
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/streets-v12';

    let resizeObserver: ResizeObserver | null = null;
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: initialStyle,
        center: initialCoords,
        zoom: isProtectorHUD ? 14.8 : 18,
        pitch: isProtectorHUD ? 30 : 60,
        bearing: 0,
        antialias: true
      });

      resizeObserver = new ResizeObserver(() => {
        if (map.current) {
          map.current.resize();
        }
      });
      resizeObserver.observe(mapContainer.current);

      map.current.on('dragstart', () => {
        isAutoTracking.current = false;
      });

      map.current.on('style.load', () => {
        console.log("🛰️ KAVACH: Mapbox Tactical Grid Online.");
        setIsMapLoaded(true);

        if (map.current) {
          const layers = map.current.getStyle()?.layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
          )?.id;

          map.current.addLayer(
            {
              'id': 'add-3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          );

          map.current.addSource('safety-radius', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} }
          });

          map.current.addLayer({
            id: 'safety-radius-fill',
            type: 'fill',
            source: 'safety-radius',
            paint: {
              'fill-color': '#EF4444',
              'fill-opacity': 0.05
            }
          });

          map.current.addLayer({
            id: 'safety-radius-outline',
            type: 'line',
            source: 'safety-radius',
            paint: {
              'line-color': '#EF4444',
              'line-width': 2,
              'line-opacity': 0.3,
              'line-dasharray': [2, 2]
            }
          });
        }
      });

    } catch (error) {
      console.error("⚠️ KAVACH: Mapbox GL initialization failed:", error);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array so map only initializes once
}
