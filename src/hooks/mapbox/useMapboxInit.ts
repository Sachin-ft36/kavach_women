import { useState, useEffect, MutableRefObject } from 'react';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

export function useMapboxInit(
  mapContainer: MutableRefObject<HTMLDivElement | null>,
  mapRef: MutableRefObject<any>,
  currentStyle: string
) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const injectStyles = () => {
    if (document.getElementById('tactical-map-styles')) return;
    const style = document.createElement('style');
    style.id = 'tactical-map-styles';
    style.innerHTML = `
      .marker-sos { width: 16px; height: 16px; background: #FF0000; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); cursor: pointer; z-index: 100; position: relative; }
      .marker-sos::after { content: ''; position: absolute; inset: -10px; border-radius: 50%; background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.2); }
      .marker-prot-normal { width: 10px; height: 10px; background: #3B82F6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.6); }
      .marker-prot-pro { width: 12px; height: 12px; background: #EAB308; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(234, 179, 8, 0.8); }
      .marker-prot-elite { width: 14px; height: 14px; background: #FACC15; border: 2px solid #FFF; border-radius: 50%; box-shadow: 0 0 20px rgba(250, 204, 21, 1); position: relative; }
      .marker-prot-elite::before { content: ''; position: absolute; inset: -4px; border: 1px solid #FACC15; border-radius: 50%; opacity: 0.5; }
      .marker-prot-responding { width: 18px; height: 18px; background: #2563EB; border: 3px solid #FFF; border-radius: 50%; box-shadow: 0 0 25px rgba(37, 99, 235, 0.8); animation: pulse-blue 2s infinite; z-index: 1000; }
      @keyframes pulse-blue {
        0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
        100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
      }
      .marker-transit { 
        width: 18px; 
        height: 18px; 
        background: #3B82F6; 
        border: 2px solid white; 
        border-radius: 50%; 
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); 
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 150;
        position: relative;
      }
      .marker-transit::after {
        content: '🚗';
        font-size: 8px;
      }
      .marker-transit-active { 
        width: 24px;
        height: 24px;
        background: #06B6D4; 
        border: 3px solid #FFF; 
        box-shadow: 0 0 25px rgba(6, 182, 212, 0.9); 
        animation: pulse-cyan 1.5s infinite;
        z-index: 800;
      }
      .marker-transit-active::after {
        content: '🚗';
        font-size: 11px;
      }
      @keyframes pulse-cyan {
        0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(6, 182, 212, 0); }
        100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
      }
    `;
    document.head.appendChild(style);
  };

  useEffect(() => {
    injectStyles();
    const mb = (window as any).mapboxgl;
    if (!mapContainer.current || !mb) return;

    mb.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mb.Map({
      container: mapContainer.current,
      style: currentStyle,
      center: [78.9629, 21.0],
      zoom: 4.2,
      pitch: 0,
      bearing: 0,
      projection: { name: 'mercator' },
      antialias: true
    });

    mapRef.current.on('style.load', () => {
      setIsMapLoaded(true);
      mapRef.current.resize();
      setTimeout(() => mapRef.current?.resize(), 200);
      setTimeout(() => mapRef.current?.resize(), 800);

      const applyGeoFilters = () => {
        try {
          const isDarkTheme = currentStyle.includes('dark') || currentStyle.includes('satellite');
          const borderPrimaryColor = isDarkTheme ? '#FFFFFF' : '#1F2937';
          const borderBgColor = isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(31, 41, 55, 0.15)';

          if (mapRef.current.getLayer('country-label')) {
            mapRef.current.setFilter('country-label', ['==', ['get', 'name_en'], 'India']);
          }

          if (mapRef.current.getLayer('state-label')) {
            mapRef.current.setFilter('state-label', ['==', ['get', 'iso_3166_1'], 'IN']);
          }

          const settlementLayers = ['settlement-label', 'settlement-major-label', 'settlement-minor-label', 'settlement-subdivision-label'];
          settlementLayers.forEach(layer => {
            if (mapRef.current.getLayer(layer)) {
              mapRef.current.setFilter(layer, ['==', ['get', 'iso_3166_1'], 'IN']);
            }
          });

          if (mapRef.current.getLayer('admin-1-boundary')) {
            mapRef.current.setFilter('admin-1-boundary', ['==', ['get', 'iso_3166_1'], 'IN']);
          }

          const boundaryLayers = ['admin-0-boundary', 'admin-0-boundary-disputed', 'admin-0-boundary-bg'];
          boundaryLayers.forEach(layer => {
            if (mapRef.current.getLayer(layer)) {
              mapRef.current.setFilter(layer, [
                'any',
                ['==', ['get', 'left_iso'], 'IN'],
                ['==', ['get', 'right_iso'], 'IN'],
                ['==', ['get', 'disputed'], 1],
                ['==', ['get', 'disputed'], true]
              ]);

              if (layer === 'admin-0-boundary' || layer === 'admin-0-boundary-disputed') {
                mapRef.current.setPaintProperty(layer, 'line-color', borderPrimaryColor);
                mapRef.current.setPaintProperty(layer, 'line-width', 2.2);
                mapRef.current.setPaintProperty(layer, 'line-opacity', 0.95);
              }
              if (layer === 'admin-0-boundary-bg') {
                mapRef.current.setPaintProperty(layer, 'line-color', borderBgColor);
                mapRef.current.setPaintProperty(layer, 'line-width', 5.0);
                mapRef.current.setPaintProperty(layer, 'line-opacity', 0.8);
              }
            }
          });

          const style = mapRef.current.getStyle();
          if (style && style.layers) {
            style.layers.forEach((layer: any) => {
              if (layer.type === 'symbol') {
                try {
                  mapRef.current.setPaintProperty(layer.id, 'text-opacity', 1.0);
                  const isDark = currentStyle.includes('dark') || currentStyle.includes('satellite');
                  mapRef.current.setPaintProperty(layer.id, 'text-color', isDark ? '#FFFFFF' : '#0F172A');
                  mapRef.current.setLayerZoomRange(layer.id, 1, 24);
                  mapRef.current.setLayoutProperty(layer.id, 'text-allow-overlap', false);
                  mapRef.current.setLayoutProperty(layer.id, 'text-ignore-placement', false);
                  mapRef.current.setLayoutProperty(layer.id, 'text-optional', true);
                  mapRef.current.setLayoutProperty(layer.id, 'text-padding', 2.0);
                  mapRef.current.setLayoutProperty(layer.id, 'text-size', [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, 11,
                    11, 13.8,
                    16, 17.5
                  ]);
                } catch (err) {}
              }
            });
          }
        } catch (e) {
          console.warn("⚠️ Mapbox Geo-Filter Error:", e);
        }
      };

      applyGeoFilters();

      mapRef.current.addSource('district-mask', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      mapRef.current.addLayer({
        id: 'district-mask-fill',
        type: 'fill',
        source: 'district-mask',
        paint: { 'fill-color': '#F1F5F9', 'fill-opacity': 0.98 }
      });

      mapRef.current.addSource('district-boundary', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      mapRef.current.addLayer({
        id: 'district-boundary-fill',
        type: 'fill',
        source: 'district-boundary',
        paint: { 'fill-color': '#06B6D4', 'fill-opacity': 0.04 }
      });
      mapRef.current.addLayer({
        id: 'district-boundary-outline-glow',
        type: 'line',
        source: 'district-boundary',
        paint: { 'line-color': '#06B6D4', 'line-width': 10, 'line-opacity': 0.25 },
        layout: { 'line-join': 'round', 'line-cap': 'round' }
      });
      mapRef.current.addLayer({
        id: 'district-boundary-outline',
        type: 'line',
        source: 'district-boundary',
        paint: { 'line-color': '#06B6D4', 'line-width': 3.2, 'line-opacity': 0.85 },
        layout: { 'line-join': 'round', 'line-cap': 'round' }
      });

      mapRef.current.addSource('selected-radius', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      mapRef.current.addLayer({ id: 'radius-circle', type: 'fill', source: 'selected-radius', paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.1 } });
      mapRef.current.addLayer({ id: 'radius-outline', type: 'line', source: 'selected-radius', paint: { 'line-color': '#3B82F6', 'line-width': 2, 'line-dasharray': [2, 2] } });

      mapRef.current.addSource('forensic-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      mapRef.current.addLayer({ id: 'f-safe', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'safe'], paint: { 'line-color': '#10B981', 'line-width': 4, 'line-dasharray': [2, 2], 'line-opacity': 0.4 } });
      mapRef.current.addLayer({ id: 'f-victim', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'victim'], paint: { 'line-color': '#F43F5E', 'line-width': 5 } });
      mapRef.current.addLayer({ id: 'f-projected', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'projected'], paint: { 'line-color': '#22D3EE', 'line-width': 3, 'line-dasharray': [2, 1] } });
      mapRef.current.addLayer({ id: 'f-protector', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'protector'], paint: { 'line-color': '#3B82F6', 'line-width': 4, 'line-dasharray': [3, 2], 'line-opacity': 0.6 } });

      mapRef.current.addSource('intercept-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      mapRef.current.addLayer({
        id: 'intercept-route-glow',
        type: 'line',
        source: 'intercept-route',
        paint: { 'line-color': '#60A5FA', 'line-width': 12, 'line-opacity': 0.35 },
        layout: { 'line-join': 'round', 'line-cap': 'round' }
      });
      mapRef.current.addLayer({
        id: 'intercept-route-line',
        type: 'line',
        source: 'intercept-route',
        paint: { 'line-color': '#3B82F6', 'line-width': 5, 'line-opacity': 0.9 },
        layout: { 'line-join': 'round', 'line-cap': 'round' }
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    setIsMapLoaded(false);
    mapRef.current.setStyle(currentStyle);
  }, [currentStyle]);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const interval = setInterval(() => {
      mapRef.current?.resize();
    }, 1000);
    const timeout = setTimeout(() => clearInterval(interval), 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isMapLoaded]);

  return { isMapLoaded };
}
