import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Users, Navigation, ShieldAlert, User, Layers } from 'lucide-react';
import { fetchRouteMappls } from '../../services/MapplsService';

interface CommandMapProps {
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

  // Forensic & Transit Props (Restored for Stability)
  victimPath?: any[];
  protectorPath?: any[];
  safePath?: any[];
  projectedPath?: any[];
  replayProgress?: number;
}

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

const STYLES_LIST = [
  { id: 'streets', name: 'Standard Streets', url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'light', name: 'Strategic Light', url: 'mapbox://styles/mapbox/light-v11' },
  { id: 'dark', name: 'Tactical Dark', url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'satellite', name: 'Satellite Intel', url: 'mapbox://styles/mapbox/satellite-streets-v12' }
];

// 🏛️ GEOGRAPHIC CENTER REGISTER FOR STATES & DISTRICTS
const REGIONAL_COORDINATES: Record<string, [number, number]> = {
  // States
  'madhya pradesh': [78.6569, 22.9734],
  'uttar pradesh': [80.9462, 26.8467],
  'delhi': [77.2090, 28.6139],
  'maharashtra': [75.7139, 19.7515],
  'rajasthan': [73.8478, 27.0238],
  'gujarat': [71.1924, 22.2587],
  'karnataka': [75.7139, 15.3173],
  'tamil nadu': [78.6569, 11.1271],
  'kerala': [76.0856, 10.8505],
  'andhra pradesh': [79.7400, 15.9129],
  'telangana': [79.0193, 18.1124],
  'west bengal': [87.8550, 22.9868],
  'bihar': [85.3131, 25.0961],
  'punjab': [75.3412, 31.1471],
  'haryana': [76.0856, 29.0588],

  // Districts
  'rewa': [81.2998, 24.5362],
  'bhopal': [77.4126, 23.2599],
  'indore': [75.8577, 22.7196],
  'jabalpur': [79.9864, 23.1686],
  'gwalior': [78.1772, 26.2183],
  'lucknow': [80.9462, 26.8467],
  'noida': [77.3910, 28.5355],
  'ghaziabad': [77.4224, 28.6692],
  'kanpur': [80.3319, 26.4499],
  'patna': [85.1376, 25.5941],
  'mumbai': [72.8777, 19.0760],
  'pune': [73.8567, 18.5204],
  'bangalore': [77.5946, 12.9716],
  'chennai': [80.2707, 13.0827],
  'hyderabad': [78.4867, 17.3850],
  'kolkata': [88.3639, 22.5726],
  'jaipur': [75.7873, 26.9124]
};

export default function CommandMap({
  activeAlerts,
  activeProtectors,
  pendingProtectors = [],
  activeFirs = [],
  activeJourneys = [],
  onAlertClick,
  centerOverride,
  selectedState = 'National',
  selectedAlertId,
  selectedProtectorId,
  isSovereignActive = false,
  showHeatmap = false,
  victimPath = [],
  protectorPath = [],
  safePath = [],
  projectedPath = [],
  replayProgress = 1
}: CommandMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);
  const [currentStyle, setCurrentStyle] = React.useState('mapbox://styles/mapbox/streets-v12');
  const [isStyleMenuOpen, setIsStyleMenuOpen] = React.useState(false);

  // 🛰️ DYNAMIC DUAL-MARKER TELEMETRY METRICS (ETA, Distance, Stale Alarm)
  const [metrics, setMetrics] = React.useState<{
    distance: string;
    eta: string;
    isStale: boolean;
    staleTimer: number;
  }>({ distance: 'Calculating...', eta: 'Calculating...', isStale: false, staleTimer: 0 });

  const lastResponderStateRef = useRef<{
    lat: number;
    lng: number;
    timestamp: number;
  } | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // returns meters
  };

  // 🛡️ TACTICAL MARKER STYLES
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
    map.current = new mb.Map({
      container: mapContainer.current,
      style: currentStyle, /* Dynamic map style state */
      center: [78.9629, 21.0], /* Center India perfectly */
      zoom: 4.2, /* Fit whole India */
      pitch: 0, /* Straight flat 2D look */
      bearing: 0, /* North aligned */
      projection: { name: 'mercator' }, /* Flat Mercator projection instead of curved globe */
      antialias: true
    });

    map.current.on('style.load', () => {
      setIsMapLoaded(true);
      map.current.resize();
      setTimeout(() => map.current?.resize(), 200);
      setTimeout(() => map.current?.resize(), 800);

      // 🛰️ TACTICAL GEO-FILTER: HIDE FOREIGN COUNTRIES, BORDERS & LABELS WITH DYNAMIC COLORING
      const applyGeoFilters = () => {
        try {
          const isDarkTheme = currentStyle.includes('dark') || currentStyle.includes('satellite');
          const borderPrimaryColor = isDarkTheme ? '#FFFFFF' : '#1F2937';
          const borderBgColor = isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(31, 41, 55, 0.15)';

          // 1. Hide country names except India
          if (map.current.getLayer('country-label')) {
            map.current.setFilter('country-label', ['==', ['get', 'name_en'], 'India']);
          }

          // 2. Hide state names outside India
          if (map.current.getLayer('state-label')) {
            map.current.setFilter('state-label', ['==', ['get', 'iso_3166_1'], 'IN']);
          }

          // 3. Hide city/settlement names outside India
          const settlementLayers = ['settlement-label', 'settlement-major-label', 'settlement-minor-label', 'settlement-subdivision-label'];
          settlementLayers.forEach(layer => {
            if (map.current.getLayer(layer)) {
              map.current.setFilter(layer, ['==', ['get', 'iso_3166_1'], 'IN']);
            }
          });

          // 4. Hide foreign state outlines
          if (map.current.getLayer('admin-1-boundary')) {
            map.current.setFilter('admin-1-boundary', ['==', ['get', 'iso_3166_1'], 'IN']);
          }

          // 5. Hide foreign international boundary lines & highlight India's border clearly
          const boundaryLayers = ['admin-0-boundary', 'admin-0-boundary-disputed', 'admin-0-boundary-bg'];
          boundaryLayers.forEach(layer => {
            if (map.current.getLayer(layer)) {
              // Keep only international boundaries that touch India (left or right country code is IN) or are disputed in India
              map.current.setFilter(layer, [
                'any',
                ['==', ['get', 'left_iso'], 'IN'],
                ['==', ['get', 'right_iso'], 'IN'],
                ['==', ['get', 'disputed'], 1],
                ['==', ['get', 'disputed'], true]
              ]);

              // Style India's actual international outer border dynamically based on theme
              if (layer === 'admin-0-boundary' || layer === 'admin-0-boundary-disputed') {
                map.current.setPaintProperty(layer, 'line-color', borderPrimaryColor);
                map.current.setPaintProperty(layer, 'line-width', 2.2); // Perfect visibility
                map.current.setPaintProperty(layer, 'line-opacity', 0.95);
              }
              if (layer === 'admin-0-boundary-bg') {
                map.current.setPaintProperty(layer, 'line-color', borderBgColor);
                map.current.setPaintProperty(layer, 'line-width', 5.0);
                map.current.setPaintProperty(layer, 'line-opacity', 0.8);
              }
            }
          });

          // 6. Force extreme visibility on all town, village, and area labels (make them show up early and clearly!)
          const style = map.current.getStyle();
          if (style && style.layers) {
            style.layers.forEach((layer: any) => {
              if (layer.type === 'symbol') {
                try {
                  // Make labels fully opaque
                  map.current.setPaintProperty(layer.id, 'text-opacity', 1.0);

                  // Make label text bold and clear (charcoal for light theme, white for dark)
                  const isDark = currentStyle.includes('dark') || currentStyle.includes('satellite');
                  map.current.setPaintProperty(layer.id, 'text-color', isDark ? '#FFFFFF' : '#0F172A');

                  // Force labels to show up early by setting minzoom to 1
                  map.current.setLayerZoomRange(layer.id, 1, 24);

                  // Clean collision deduplication rules to prevent double text/overlapping names
                  map.current.setLayoutProperty(layer.id, 'text-allow-overlap', false);
                  map.current.setLayoutProperty(layer.id, 'text-ignore-placement', false);
                  map.current.setLayoutProperty(layer.id, 'text-optional', true);
                  map.current.setLayoutProperty(layer.id, 'text-padding', 2.0); // Safe spacing to prevent text collision

                  // Increase text size for supreme readability
                  map.current.setLayoutProperty(layer.id, 'text-size', [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, 11,
                    11, 13.8, // Ultra-clear 13.8px at zoom 11 (extremely visible!)
                    16, 17.5
                  ]);
                } catch (err) {
                  // Silent catch for layers that don't support text properties (e.g. icon layers)
                }
              }
            });
          }
        } catch (e) {
          console.warn("⚠️ Mapbox Geo-Filter Error:", e);
        }
      };

      applyGeoFilters();

      // 🏢 DISTRICT/STATE MASK LAYER (Blanks out everything outside jurisdiction)
      map.current.addSource('district-mask', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({
        id: 'district-mask-fill',
        type: 'fill',
        source: 'district-mask',
        paint: {
          'fill-color': '#F1F5F9', // Blends with map background
          'fill-opacity': 0.98     // Near solid mask
        }
      });

      // 🏢 DISTRICT/STATE BOUNDARY SECURED ZONE LAYER
      map.current.addSource('district-boundary', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({
        id: 'district-boundary-fill',
        type: 'fill',
        source: 'district-boundary',
        paint: {
          'fill-color': '#06B6D4', // Vibrant Cyan accent
          'fill-opacity': 0.04
        }
      });
      map.current.addLayer({
        id: 'district-boundary-outline-glow',
        type: 'line',
        source: 'district-boundary',
        paint: {
          'line-color': '#06B6D4',
          'line-width': 10,
          'line-opacity': 0.25
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        }
      });
      map.current.addLayer({
        id: 'district-boundary-outline',
        type: 'line',
        source: 'district-boundary',
        paint: {
          'line-color': '#06B6D4',
          'line-width': 3.2,
          'line-opacity': 0.85
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        }
      });

      // Radius Sources
      map.current.addSource('selected-radius', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({ id: 'radius-circle', type: 'fill', source: 'selected-radius', paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.1 } });
      map.current.addLayer({ id: 'radius-outline', type: 'line', source: 'selected-radius', paint: { 'line-color': '#3B82F6', 'line-width': 2, 'line-dasharray': [2, 2] } });

      // Forensic Sources
      map.current.addSource('forensic-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({ id: 'f-safe', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'safe'], paint: { 'line-color': '#10B981', 'line-width': 4, 'line-dasharray': [2, 2], 'line-opacity': 0.4 } });
      map.current.addLayer({ id: 'f-victim', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'victim'], paint: { 'line-color': '#F43F5E', 'line-width': 5 } });
      map.current.addLayer({ id: 'f-projected', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'projected'], paint: { 'line-color': '#22D3EE', 'line-width': 3, 'line-dasharray': [2, 1] } });
      map.current.addLayer({ id: 'f-protector', type: 'line', source: 'forensic-source', filter: ['==', ['get', 'type'], 'protector'], paint: { 'line-color': '#3B82F6', 'line-width': 4, 'line-dasharray': [3, 2], 'line-opacity': 0.6 } });

      // Live Mappls Route Sources (Glowing Tactical Intercept & Safe Ride)
      map.current.addSource('intercept-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({
        id: 'intercept-route-glow',
        type: 'line',
        source: 'intercept-route',
        paint: { 'line-color': '#60A5FA', 'line-width': 12, 'line-opacity': 0.35 },
        layout: { 'line-join': 'round', 'line-cap': 'round' }
      });
      map.current.addLayer({
        id: 'intercept-route-line',
        type: 'line',
        source: 'intercept-route',
        paint: { 'line-color': '#3B82F6', 'line-width': 5, 'line-opacity': 0.9 },
        layout: { 'line-join': 'round', 'line-cap': 'round' }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 🛰️ DYNAMIC VIEWPORT LOCK TO JURISDICTION / DISTRICT (Restricts bounds and centers map)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const district = sessionStorage.getItem('kavach_admin_district');
    const state = selectedState || sessionStorage.getItem('kavach_admin_state');

    // Helper to extract bounds from GeoJSON
    const getGeoJSONBounds = (geojson: any): [[number, number], [number, number]] | null => {
      let coords: [number, number][] = [];
      if (geojson.type === 'Polygon') {
        coords = geojson.coordinates[0];
      } else if (geojson.type === 'MultiPolygon') {
        geojson.coordinates.forEach((poly: any) => {
          if (poly && poly[0]) coords = coords.concat(poly[0]);
        });
      } else if (geojson.type === 'LineString') {
        coords = geojson.coordinates;
      }
      if (coords.length === 0) return null;

      let minLng = coords[0][0];
      let maxLng = coords[0][0];
      let minLat = coords[0][1];
      let maxLat = coords[0][1];

      coords.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });

      return [[minLng, minLat], [maxLng, maxLat]];
    };

    // Helper to create an inverse polygon (mask) covering everything except the selected area
    const createMaskGeoJSON = (geojson: any) => {
      const worldRing = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90]
      ];
      let rings: any[] = [worldRing];

      if (geojson.type === 'Polygon') {
        rings = rings.concat(geojson.coordinates);
      } else if (geojson.type === 'MultiPolygon') {
        geojson.coordinates.forEach((poly: any) => {
          if (poly) rings = rings.concat(poly);
        });
      }

      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: rings
        }
      };
    };

    // Helper to lock boundaries and load polygon GeoJSON
    const applyViewportLock = (polygonGeoJSON: any) => {
      if (!map.current) return;

      // 1. Draw boundary outline and fill
      const borderSource = map.current.getSource('district-boundary');
      if (borderSource) {
        borderSource.setData(polygonGeoJSON);
      }

      // 2. Create and draw the visual mask outside the district
      const maskSource = map.current.getSource('district-mask');
      if (maskSource) {
        const maskGeoJSON = createMaskGeoJSON(polygonGeoJSON);
        maskSource.setData(maskGeoJSON);

        // Update mask fill color dynamically based on theme for perfect blend
        const isDark = currentStyle.includes('dark') || currentStyle.includes('satellite');
        map.current.setPaintProperty('district-mask-fill', 'fill-color', isDark ? '#090D16' : '#F1F5F9');
      }

      // 3. Compute exact bounding box of the district/state
      const bounds = getGeoJSONBounds(polygonGeoJSON);
      if (bounds) {
        // Fit viewport perfectly to the district with nice padding
        map.current.fitBounds(bounds, { padding: 60, duration: 1500 });

        // Add padding to maxBounds so they can pan slightly but are strictly locked inside
        const padLng = Math.max((bounds[1][0] - bounds[0][0]) * 0.15, 0.05);
        const padLat = Math.max((bounds[1][1] - bounds[0][1]) * 0.15, 0.05);
        const maxBounds: [[number, number], [number, number]] = [
          [bounds[0][0] - padLng, bounds[0][1] - padLat], // SW
          [bounds[1][0] + padLng, bounds[1][1] + padLat]  // NE
        ];
        map.current.setMaxBounds(maxBounds);
      }
    };

    // 1. If District-level admin (e.g. Rewa)
    if (district) {
      const distKey = district.toLowerCase();
      // Instantly jump to local registry coordinates to prevent initial flash/delay
      if (REGIONAL_COORDINATES[distKey]) {
        map.current.jumpTo({ center: REGIONAL_COORDINATES[distKey], zoom: 11.5 });
      }

      // Fetch official boundary GeoJSON from Nominatim
      const queryStr = distKey === 'rewa' ? 'Rewa District, Madhya Pradesh, India' : `${district} District, ${state || 'India'}`;
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&polygon_geojson=1&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0 && data[0].geojson && map.current) {
            applyViewportLock(data[0].geojson);
          }
        })
        .catch(err => console.error("District boundary polygon geocode fail:", err));
      return;
    }

    // 2. If State-wide Command
    if (state && state.toLowerCase() !== 'national' && state.toLowerCase() !== 'all') {
      const stateKey = state.toLowerCase();
      if (REGIONAL_COORDINATES[stateKey]) {
        map.current.jumpTo({ center: REGIONAL_COORDINATES[stateKey], zoom: 6.8 });
      }

      // Fetch official boundary GeoJSON from Nominatim
      const queryStr = `${state}, India`;
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&polygon_geojson=1&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0 && data[0].geojson && map.current) {
            applyViewportLock(data[0].geojson);
          }
        })
        .catch(err => console.error("State boundary polygon geocode fail:", err));
      return;
    }

    // 3. National / Sovereign level command
    if (map.current.getSource('district-boundary')) {
      map.current.getSource('district-boundary').setData({ type: 'FeatureCollection', features: [] });
    }
    if (map.current.getSource('district-mask')) {
      map.current.getSource('district-mask').setData({ type: 'FeatureCollection', features: [] });
    }
    map.current.setMaxBounds(null); // Release all boundary locks
    map.current.jumpTo({ center: [78.9629, 21.0], zoom: 4.2 });
  }, [isMapLoaded, selectedState]);

  // 🛰️ DYNAMIC STYLE UPDATE LISTENER
  useEffect(() => {
    if (!map.current) return;
    setIsMapLoaded(false);
    map.current.setStyle(currentStyle);
  }, [currentStyle]);



  // 🛰️ DYNAMIC RESIZE PROPAGATION FOR TACTICAL GRID
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const interval = setInterval(() => {
      map.current?.resize();
    }, 1000); // Poll resize for first 5 seconds to guarantee full-bleed rendering
    const timeout = setTimeout(() => clearInterval(interval), 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isMapLoaded]);

  // 🛰️ LIVE MAPPLS NAVIGATION TRACING (Victims & Safe Rides)
  useEffect(() => {
    if (!map.current || !isMapLoaded || !map.current.getSource('intercept-route')) return;

    let routeFetched = false;
    let startCoords: [number, number] | null = null;
    let endCoords: [number, number] | null = null;

    if (selectedAlertId) {
      // 🕵️‍♂️ Check if it's an SOS Active Alert
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      if (alert && (alert.status === 'active' || alert.status === 'responding' || alert.status === 'Responding' || alert.status === 'ACTIVE')) {
        const vLat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
        const vLng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;

        if (vLat && vLng) {
          const responders = alert.activeResponders || [];
          if (responders.length > 0) {
            const responderId = responders[0].id || responders[0].uid;
            const p = activeProtectors.find(p => p.id === responderId);
            if (p) {
              const pLat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
              const pLng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;

              if (pLat && pLng) {
                startCoords = [pLng, pLat];
                endCoords = [vLng, vLat];
                routeFetched = true;
              }
            }
          }
        }
      }

      // 🚗 If not an SOS Alert, check if it's an Active Safe Ride (Journey)
      if (!routeFetched) {
        const journey = activeJourneys.find(j => j.id === selectedAlertId);
        if (journey && journey.status !== 'completed' && journey.status !== 'resolved') {
          const uLat = journey.latitude || journey.lat || journey.lastLat || journey.currentLat || journey.location?.latitude || journey.location?.lat;
          const uLng = journey.longitude || journey.lng || journey.lastLng || journey.currentLng || journey.location?.longitude || journey.location?.lng;

          const destLat = journey.targetCoords?.[1] || journey.destLat || journey.destinationLatitude;
          const destLng = journey.targetCoords?.[0] || journey.destLng || journey.destinationLongitude;

          if (uLat && uLng && destLat && destLng) {
            startCoords = [uLng, uLat];
            endCoords = [destLng, destLat];
            routeFetched = true;
          }
        }
      }
    }

    if (routeFetched && startCoords && endCoords) {
      fetchRouteMappls(startCoords[0], startCoords[1], endCoords[0], endCoords[1]).then(routePath => {
        if (!map.current || !map.current.getSource('intercept-route')) return;

        let finalCoordinates: [number, number][] = [];
        if (routePath && routePath.length > 0) {
          finalCoordinates = routePath;
        } else {
          // Fallback to straight line if API fails or has error
          finalCoordinates = [startCoords!, endCoords!];
        }

        map.current.getSource('intercept-route').setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: finalCoordinates
            }
          }]
        });

        // Auto-center bounds to fit route nicely in tactical room view
        if (finalCoordinates.length > 1 && map.current) {
          const mb = (window as any).mapboxgl;
          if (mb) {
            const bounds = new mb.LngLatBounds();
            finalCoordinates.forEach(coord => bounds.extend(coord));
            map.current.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 1500 });
          }
        }
      });
    } else {
      // Clear route if nothing selected or no active tracking
      map.current.getSource('intercept-route').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [selectedAlertId, activeAlerts, activeProtectors, activeJourneys, isMapLoaded]);

  // 🛰️ DYNAMIC INTERCEPT METRICS CALCULATOR (Haversine ETA & 45s Stale Alarm)
  useEffect(() => {
    if (!selectedAlertId) {
      setMetrics({ distance: 'Calculating...', eta: 'Calculating...', isStale: false, staleTimer: 0 });
      lastResponderStateRef.current = null;
      return;
    }

    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert) return;

    const vLat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
    const vLng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;

    if (!vLat || !vLng) return;

    const responders = alert.activeResponders || [];
    if (responders.length === 0) {
      setMetrics({ distance: 'Awaiting Responders...', eta: 'N/A', isStale: false, staleTimer: 0 });
      lastResponderStateRef.current = null;
      return;
    }

    const responderId = responders[0].id || responders[0].uid;
    const p = activeProtectors.find(p => p.id === responderId);
    if (!p) {
      setMetrics({ distance: 'Responders En Route...', eta: 'Calculating...', isStale: false, staleTimer: 0 });
      return;
    }

    const pLat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
    const pLng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;

    if (!pLat || !pLng) return;

    // Calculate distance in meters
    const distMeters = calculateDistance(pLat, pLng, vLat, vLng);
    const distStr = distMeters < 1000 ? `${distMeters.toFixed(0)} meters` : `${(distMeters / 1000).toFixed(1)} km`;

    // Calculate ETA assuming 35 km/h average intercept speed in city traffic (9.7 m/s) if p.speed is missing/low
    const speedKmh = Math.max(p.speed || 0, 35);
    const speedMs = speedKmh * (1000 / 3600);
    const etaSec = distMeters / speedMs;
    const etaMins = Math.floor(etaSec / 60);
    const etaRemainingSec = Math.floor(etaSec % 60);
    const etaStr = etaMins > 0 ? `${etaMins}m ${etaRemainingSec}s` : `${etaRemainingSec}s`;

    // Stale check
    const now = Date.now();
    let isStale = false;
    let staleSec = 0;

    if (lastResponderStateRef.current) {
      const prev = lastResponderStateRef.current;
      // If position is exactly the same, check duration
      if (Math.abs(prev.lat - pLat) < 0.00001 && Math.abs(prev.lng - pLng) < 0.00001) {
        staleSec = Math.floor((now - prev.timestamp) / 1000);
        if (staleSec >= 45) {
          isStale = true;
        }
      } else {
        // Position changed, update ref
        lastResponderStateRef.current = { lat: pLat, lng: pLng, timestamp: now };
      }
    } else {
      // Initialize ref
      lastResponderStateRef.current = { lat: pLat, lng: pLng, timestamp: now };
    }

    setMetrics({
      distance: distStr,
      eta: etaStr,
      isStale,
      staleTimer: staleSec
    });

    // Sound Beep Alarm if stale
    if (isStale) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 880; // High pitch alert sound
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15); // short beep
      } catch (e) { }
    }

  }, [selectedAlertId, activeAlerts, activeProtectors]);

  // 🌍 FORENSIC PATH SYNC
  useEffect(() => {
    if (!map.current || !isMapLoaded || !map.current.getSource('forensic-source')) return;

    const slicePath = (path: any[], progress: number) => {
      if (!path || path.length === 0) return [];
      const count = Math.ceil(path.length * progress);
      return path.slice(0, count).map(p => Array.isArray(p) ? p : [p.lng, p.lat]);
    };

    const features = [];
    if (safePath.length > 1) features.push({ type: 'Feature', properties: { type: 'safe' }, geometry: { type: 'LineString', coordinates: safePath.map(p => Array.isArray(p) ? p : [p.lng, p.lat]) } });
    if (victimPath.length > 1) features.push({ type: 'Feature', properties: { type: 'victim' }, geometry: { type: 'LineString', coordinates: slicePath(victimPath, replayProgress) } });
    if (projectedPath.length > 1) features.push({ type: 'Feature', properties: { type: 'projected' }, geometry: { type: 'LineString', coordinates: projectedPath.map(p => Array.isArray(p) ? p : [p.lng, p.lat]) } });
    if (protectorPath.length > 1) features.push({ type: 'Feature', properties: { type: 'protector' }, geometry: { type: 'LineString', coordinates: protectorPath.map(p => Array.isArray(p) ? p : [p.lng, p.lat]) } });

    map.current.getSource('forensic-source').setData({ type: 'FeatureCollection', features });
  }, [victimPath, protectorPath, safePath, projectedPath, replayProgress]);

  // 📍 SYNC MARKERS & RADIUS
  useEffect(() => {
    const mb = (window as any).mapboxgl;
    if (!map.current || !mb || !isMapLoaded) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    activeAlerts.forEach(alert => {
      const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
      const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
      if (!lat || !lng) return;

      const isSelected = selectedAlertId === alert.id;
      const el = document.createElement('div');
      el.className = 'marker-sos';
      el.style.zIndex = isSelected ? '500' : '100'; // Higher when selected
      el.onclick = () => onAlertClick?.(alert.id);

      const marker = new mb.Marker(el).setLngLat([lng, lat]).addTo(map.current);
      markersRef.current.push(marker);

    });

    // 🔴 TACTICAL RADIUS SYNC (Separate for Stability)
    if (selectedAlertId && map.current) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      const journey = activeJourneys.find(j => j.id === selectedAlertId || j.userId === selectedAlertId);

      if (alert) {
        const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
        const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;

        if (lat && lng) {
          map.current.flyTo({ center: [lng, lat], zoom: 14, pitch: 45, duration: 2000 });
          const radiusGeoJSON = createGeoJSONCircle([lng, lat], 2);
          const updateRadius = () => {
            if (map.current.getSource('selected-radius')) {
              map.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [radiusGeoJSON] });
              map.current.setPaintProperty('radius-circle', 'fill-color', '#EF4444');
              map.current.setPaintProperty('radius-circle', 'fill-opacity', 0.2);
              map.current.setPaintProperty('radius-outline', 'line-color', '#EF4444');
              map.current.setPaintProperty('radius-outline', 'line-width', 2);

              if (map.current.getLayer('radius-circle')) map.current.moveLayer('radius-circle');
              if (map.current.getLayer('radius-outline')) map.current.moveLayer('radius-outline');
            }
          };

          if (map.current.isStyleLoaded()) updateRadius();
          else map.current.once('styledata', updateRadius);
        }
      } else if (journey) {
        const lat = journey.latitude || journey.lat || journey.lastLat || journey.currentLat || journey.location?.latitude || journey.location?.lat;
        const lng = journey.longitude || journey.lng || journey.lastLng || journey.currentLng || journey.long || journey.location?.longitude || journey.location?.lng;

        if (lat && lng) {
          map.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 2000 });
          const radiusGeoJSON = createGeoJSONCircle([lng, lat], 1.2); // 1.2km safety perimeter for passenger
          const updateRadius = () => {
            if (map.current.getSource('selected-radius')) {
              map.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [radiusGeoJSON] });
              map.current.setPaintProperty('radius-circle', 'fill-color', '#06B6D4');
              map.current.setPaintProperty('radius-circle', 'fill-opacity', 0.15);
              map.current.setPaintProperty('radius-outline', 'line-color', '#06B6D4');
              map.current.setPaintProperty('radius-outline', 'line-width', 1.5);

              if (map.current.getLayer('radius-circle')) map.current.moveLayer('radius-circle');
              if (map.current.getLayer('radius-outline')) map.current.moveLayer('radius-outline');
            }
          };

          if (map.current.isStyleLoaded()) updateRadius();
          else map.current.once('styledata', updateRadius);
        }
      }
    } else if (map.current && map.current.getSource('selected-radius')) {
      map.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [] });
    }

    activeProtectors.forEach(p => {
      // 🛰️ Check if this protector is currently an active victim to avoid double markers
      const isVictim = activeAlerts.some(a =>
        (a.userId === p.id || a.id === p.id || a.phone === p.phone || a.phoneNumber === p.phoneNumber) &&
        (a.status === 'active' || a.status === 'responding' || a.status === 'Responding' || a.status === 'ACTIVE')
      );
      if (isVictim) return;

      // 🛰️ ROBUST COORDINATE RESOLUTION
      const lat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
      const lng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;

      if (!lat || !lng) return;

      const isSelected = selectedProtectorId === p.id;
      const occ = (p.protectorVetting?.occupation || '').toLowerCase();
      const rating = p.protectorVetting?.rating || 0;
      let category = 'marker-prot-normal';
      if (p.status === 'responding') category = 'marker-prot-responding';
      else {
        if (occ.includes('police') || occ.includes('army') || occ.includes('military')) category = 'marker-prot-pro';
        if (rating > 4.8) category = 'marker-prot-elite';
      }

      const el = document.createElement('div');
      el.className = category;
      el.style.zIndex = isSelected ? '1000' : '200'; // Selected protector ALWAYS on top

      const marker = new mb.Marker(el).setLngLat([lng, lat]).addTo(map.current);
      markersRef.current.push(marker);
    });

    activeJourneys.forEach(j => {
      // 🛰️ ROBUST COORDINATE RESOLUTION
      const lat = j.latitude || j.lat || j.lastLat || j.currentLat || j.location?.latitude || j.location?.lat;
      const lng = j.longitude || j.lng || j.lastLng || j.currentLng || j.long || j.location?.longitude || j.location?.lng;

      if (!lat || !lng) return;
      const isSelected = selectedAlertId === j.id || selectedAlertId === j.userId;

      const el = document.createElement('div');
      el.className = isSelected ? 'marker-transit marker-transit-active' : 'marker-transit';
      el.style.zIndex = isSelected ? '800' : '150';

      markersRef.current.push(new mb.Marker(el).setLngLat([lng, lat]).addTo(map.current));
    });

    if (selectedProtectorId) {
      const p = activeProtectors.find(p => p.id === selectedProtectorId);
      if (p) {
        const lat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
        const lng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
        if (lat && lng) {
          map.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 2000 });
        }
      }
    }

    if (!selectedAlertId && !selectedProtectorId && map.current.getSource('selected-radius')) map.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [] });

  }, [activeAlerts, activeProtectors, activeJourneys, selectedAlertId, selectedProtectorId]);

  const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points: number = 64) => {
    const coords = { latitude: center[1], longitude: center[0] };
    const km = radiusInKm;
    const ret = [];
    const distanceX = km / (111.32 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;
    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ret] } };
  };

  return (
    <div className="relative w-full h-full group">
      <div ref={mapContainer} className="w-full h-full" />

      {/* 🏛️ ADVANCED TACTICAL HUD */}
      <div className="absolute inset-x-8 top-8 flex justify-between items-start pointer-events-none z-[100]">
        {/* 📡 GRID STATUS HUD */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex gap-2"
        >
          <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="w-7 h-7 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 border border-rose-500/20">
              <AlertTriangle size={14} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Active SOS</p>
              <p className="text-sm font-black text-white tabular-nums leading-none">{activeAlerts.length}</p>
            </div>
          </div>

          <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Users size={14} />
            </div>
            <div>
              <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Protectors</p>
              <p className="text-sm font-black text-white tabular-nums leading-none">{activeProtectors.length}</p>
            </div>
          </div>

          <div className="bg-[#0F172A]/80 backdrop-blur-3xl border border-white/10 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Navigation size={14} />
            </div>
            <div>
              <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Transits</p>
              <p className="text-sm font-black text-white tabular-nums leading-none">{activeJourneys.length}</p>
            </div>
          </div>
        </motion.div>

        {/* 🏹 MISSION INTEL HUD */}
        <AnimatePresence mode="wait">
          {selectedAlertId && activeAlerts.find(a => a.id === selectedAlertId) && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-rose-600/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-rose-600/20 max-w-sm pointer-events-auto"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic leading-none">{activeAlerts.find(a => a.id === selectedAlertId)?.victimName || 'Citizen Rescue'}</h3>
                  <p className="text-[8px] font-black text-white/60 uppercase tracking-[2px] mt-1">High-Priority Mission</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Location Sector</p>
                  <p className="text-[10px] font-bold text-white line-clamp-2 leading-relaxed">
                    {activeAlerts.find(a => a.id === selectedAlertId)?.address || 'Sector Scanning...'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-[9px] font-black text-white uppercase">{activeAlerts.find(a => a.id === selectedAlertId)?.status}</p>
                  </div>
                  <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Responders</p>
                    <p className="text-[9px] font-black text-white uppercase">
                      {(() => {
                        const responders = activeAlerts.find(a => a.id === selectedAlertId)?.activeResponders || [];
                        const uniqueResponders = responders.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uid === v.uid) === i);
                        return uniqueResponders.length;
                      })()} Units
                    </p>
                  </div>
                </div>

                {/* Live Telemetry Predictor HUD */}
                <div className="bg-black/25 p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-white">
                    <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Intercept Vector</span>
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[5px] font-black rounded uppercase tracking-widest animate-pulse">PREDICTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <p className="text-[6px] font-black text-white/40 uppercase tracking-wider mb-0.5">Closing Gap</p>
                      <p className="text-[11px] font-black text-cyan-300 italic tracking-tighter leading-none">{metrics.distance}</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <p className="text-[6px] font-black text-white/40 uppercase tracking-wider mb-0.5">Est. Intercept</p>
                      <p className="text-[11px] font-black text-cyan-300 italic tracking-tighter leading-none">{metrics.eta}</p>
                    </div>
                  </div>
                </div>

                {/* Operator Alarm (Stale Check Warning) */}
                <AnimatePresence>
                  {metrics.isStale && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-rose-950/80 border border-rose-500/30 p-3 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-rose-950/40 animate-pulse text-left"
                    >
                      <div className="w-6 h-6 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-500 shrink-0 border border-rose-500/20">
                        <AlertTriangle size={12} className="animate-spin" />
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-rose-400 uppercase tracking-widest leading-none">OPERATOR ALARM</p>
                        <p className="text-[9px] font-black text-white uppercase italic tracking-tight leading-none mt-1">
                          Stall Detected ({metrics.staleTimer}s Stagnant)
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {selectedProtectorId && activeProtectors.find(p => p.id === selectedProtectorId) && !selectedAlertId && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-blue-600/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-blue-600/20 max-w-sm pointer-events-auto"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic leading-none">{activeProtectors.find(p => p.id === selectedProtectorId)?.name}</h3>
                  <p className="text-[8px] font-black text-white/60 uppercase tracking-[2px] mt-1">Verified Grid Node</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Occupation</p>
                  <p className="text-[10px] font-bold text-white uppercase">{activeProtectors.find(p => p.id === selectedProtectorId)?.protectorVetting?.occupation || 'Operative'}</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Reliability</p>
                    <p className="text-[9px] font-black text-white tabular-nums">{(activeProtectors.find(p => p.id === selectedProtectorId)?.protectorVetting?.rating || 5).toFixed(1)} / 5.0</p>
                  </div>
                  <div className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">Strikes</p>
                    <p className="text-[9px] font-black text-white tabular-nums">{(activeProtectors.find(p => p.id === selectedProtectorId)?.sosStrikeCount || 0)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🛰️ LAYER SELECTOR CONTROL BUTTON (REMOVED) */}

      {/* 🛰️ SYSTEM COMPASS / COORDINATES */}
      <div className="absolute left-8 bottom-8 pointer-events-none z-[100]">
        <div className="bg-black/50 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-full flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-white/50 uppercase tracking-[4px]">Mapbox V11 Strategic Engine</span>
        </div>
      </div>
    </div>
  );
}
