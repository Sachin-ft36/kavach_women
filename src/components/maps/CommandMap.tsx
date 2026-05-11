import React, { useEffect, useRef } from 'react';

interface CommandMapProps {
  activeAlerts: any[];
  activeProtectors: any[];
  pendingProtectors: any[];
  activeFirs: any[];
  activeJourneys?: any[];
  onAlertClick?: (id: string) => void;
  centerOverride?: [number, number];
  selectedState?: string;
  selectedAlertId?: string | null;
}

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

export default function CommandMap({
  activeAlerts,
  activeProtectors,
  pendingProtectors,
  activeFirs,
  activeJourneys = [],
  onAlertClick,
  centerOverride,
  selectedState = 'National',
  selectedAlertId
}: CommandMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // 🛡️ REFINED TACTICAL MARKER STYLES (UBER STYLE)
  const injectStyles = () => {
    if (document.getElementById('command-map-styles')) return;
    const style = document.createElement('style');
    style.id = 'command-map-styles';
    style.innerHTML = `
      /* 🔴 SOS PULSING MARKER */
      .marker-sos {
        width: 12px;
        height: 12px;
        background: #FF0000;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        cursor: pointer;
        position: relative;
        z-index: 100;
      }
      .marker-sos::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(255, 0, 0, 0.4);
        animation: sos-pulse 2s infinite ease-out;
      }
      .marker-sos::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(255, 0, 0, 0.2);
        animation: sos-pulse 2s infinite ease-out 1s;
      }
      @keyframes sos-pulse {
        0% { width: 100%; height: 100%; opacity: 1; }
        100% { width: 350%; height: 350%; opacity: 0; }
      }

      /* 🟣 SUPERCELL DISPATCHED MARKER */
      .marker-sos-supercell {
        width: 14px;
        height: 14px;
        background: #7C3AED;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(124, 58, 237, 0.6);
        cursor: pointer;
        position: relative;
        z-index: 150;
      }
      .marker-sos-supercell::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(124, 58, 237, 0.4);
        animation: supercell-pulse 1.5s infinite ease-out;
      }
      @keyframes supercell-pulse {
        0% { width: 100%; height: 100%; opacity: 1; }
        100% { width: 400%; height: 400%; opacity: 0; }
      }

      /* 🔵 ACTIVE PROTECTOR MARKER - TACTICAL BLUE DOT */
      .marker-protector-active {
        width: 10px;
        height: 10px;
        background: #3B82F6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
        position: relative;
      }
      .marker-protector-active::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.2);
        animation: protector-pulse 3s infinite ease-in-out;
      }
      @keyframes protector-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1); opacity: 0; }
      }

      /* 🟡 ELITE PROTECTOR MARKER - ROYAL GOLD DOT */
      .marker-protector-elite {
        width: 12px;
        height: 12px;
        background: #F59E0B;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.8);
        position: relative;
        z-index: 50;
      }
      .marker-protector-elite::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        background: rgba(245, 158, 11, 0.3);
        animation: elite-pulse 2s infinite ease-in-out;
      }
      @keyframes elite-pulse {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(2.2); opacity: 0; }
        100% { transform: scale(1); opacity: 0; }
      }

      /* ⚫ OFFLINE PROTECTOR MARKER */
      .marker-protector-offline {
        width: 8px;
        height: 8px;
        background: #64748B;
        border: 1.5px solid white;
        border-radius: 50%;
        opacity: 0.6;
      }

      /* 🟢 FIR JUSTICE MARKER - TACTICAL GREEN DOT */
      .marker-fir {
        width: 10px;
        height: 10px;
        background: #10B981;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
        position: relative;
      }
      .marker-fir::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.2);
        animation: fir-pulse 4s infinite ease-in-out;
      }
      @keyframes fir-pulse {
        0% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1); opacity: 0; }
      }

      .mapboxgl-popup-content {
        padding: 6px;
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.1);
        color: white;
        font-family: sans-serif;
      }
      .mapboxgl-popup-tip { border-top-color: rgba(15, 23, 42, 0.95) !important; }

      /* 🚗 TRANSIT MARKER - VEHICLE ICON */
      .marker-transit {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 80;
        transition: transform 1s linear, left 1s linear, top 1s linear;
      }
      .marker-transit::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 4px;
        background: rgba(37, 99, 235, 0.2);
        animation: transit-pulse 2s infinite ease-in-out;
      }
      @keyframes transit-pulse {
        0% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  };

  useEffect(() => {
    injectStyles();

    const mb = (window as any).mapboxgl;
    if (!mapContainer.current || !mb || !mb.Map) return;

    mb.accessToken = MAPBOX_TOKEN;
    
    const indiaBounds: [[number, number], [number, number]] = [
      [68.1, 7.5], // Southwest (Gujarat/Kanyakumari area)
      [97.4, 37.1]  // Northeast (Arunachal/Kashmir area)
    ];

    map.current = new mb.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      projection: 'mercator' as any,
      center: [78.9629, 23.5937],
      zoom: 4.5,
      pitch: 45,
      antialias: true
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // 🇮🇳 SOVEREIGN CENTERING: Focus the entire National Grid
      map.current.fitBounds(indiaBounds, {
        padding: 50,
        duration: 2000,
        essential: true
      });

      // 🏔️ INJECT 3D DEPTH ENGINE (MAINTAIN LIGHT MODE)
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // ☁️ ATMOSPHERIC LIGHT SYNC
      map.current.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      // 🏙️ PREMIUM TACTICAL HUB LABELING (ZOOM-ADAPTIVE)
      const layers = map.current.getStyle().layers;
      if (layers) {
        layers.forEach((layer: any) => {
          if (layer.type === 'symbol') {
             const isIndia = ['any', 
               ['==', ['get', 'iso_3166_1'], 'IN'], 
               ['==', ['get', 'iso_3166_1_al2'], 'IN'],
               ['==', ['get', 'worldview'], 'IN'],
               ['==', ['get', 'country_code'], 'in']
             ];

             // 🎯 SOVEREIGN FILTER: Silence foreign nodes at low zoom, unlock all at high zoom
             map.current?.setPaintProperty(layer.id, 'text-opacity', [
               'interpolate', ['linear'], ['zoom'],
               5, ['case', isIndia, 1.0, 0],
               10, 1.0
             ]);

             // 🚜 RURAL & LOCAL INTEL: Force villages and minor settlements to show
             if (layer.id.includes('settlement') || layer.id.includes('village') || layer.id.includes('neighborhood') || layer.id.includes('subdivision')) {
                map.current?.setLayoutProperty(layer.id, 'text-ignore-placement', true);
                map.current?.setLayoutProperty(layer.id, 'text-allow-overlap', true);
                map.current?.setLayoutProperty(layer.id, 'icon-ignore-placement', true);
                map.current?.setLayoutProperty(layer.id, 'icon-allow-overlap', true);
             }

             // 🎨 UHD TACTICAL STYLE FOR ALL LABELS (ROADS, POIs, CITIES, VILLAGES)
             map.current?.setPaintProperty(layer.id, 'text-color', '#FFFFFF');
             map.current?.setPaintProperty(layer.id, 'text-halo-color', '#000000');
             map.current?.setPaintProperty(layer.id, 'text-halo-width', 2.5);
             
             // Dynamic sizing based on zoom
             map.current?.setLayoutProperty(layer.id, 'text-size', [
               'interpolate', ['linear'], ['zoom'],
               3, 11,
               12, 15,
               18, 20
             ]);

             if (layer.id.includes('state') || layer.id.includes('country')) {
                map.current?.setLayoutProperty(layer.id, 'text-transform', 'uppercase');
                map.current?.setLayoutProperty(layer.id, 'text-letter-spacing', 0.1);
             }
          }

          // 🛡️ REFINED ADMINISTRATIVE BOUNDARIES
          if (layer.id.includes('admin') || layer.id.includes('boundary')) {
             map.current?.setPaintProperty(layer.id, 'line-opacity', 0); 
          }
        });
      }

      // 🇮🇳 SOVEREIGN GRID SOURCES
      map.current.addSource('india-border', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      });

      // 🗺️ STATE BOUNDARIES (GLASSMOPRHIC BLUE)
      map.current.addLayer({
        id: 'state-borders-premium',
        type: 'line',
        source: 'india-border',
        'source-layer': 'admin',
        filter: ['all', ['==', ['get', 'iso_3166_1'], 'IN'], ['==', ['get', 'admin_level'], 4]],
        paint: {
          'line-color': '#60A5FA',
          'line-width': 1.2,
          'line-opacity': 0.6
        }
      });

      // 🗺️ NATIONAL PERIMETER (NEON SHARP)
      map.current.addLayer({
        id: 'india-outline-premium',
        type: 'line',
        source: 'india-border',
        'source-layer': 'admin',
        filter: ['all', ['==', ['get', 'iso_3166_1'], 'IN'], ['==', ['get', 'admin_level'], 0]],
        paint: {
          'line-color': '#3B82F6',
          'line-width': 2,
          'line-opacity': 0.8,
          'line-blur': 1
        }
      });

      // ⚡ LIVE ROUTE SOURCE
      map.current.addSource('route-line', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current.addLayer({
        id: 'route-path',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 
          'line-color': '#3B82F6', 
          'line-width': 4, 
          'line-opacity': 0.8,
          'line-dasharray': [1, 1] 
        }
      });
    });

    return () => map.current?.remove();
  }, []);

  // 🌍 STRATEGIC STATE ZOOM ENGINE
  useEffect(() => {
    if (!map.current) return;

    const stateBounds: { [key: string]: [[number, number], [number, number]] } = {
      'National': [[68.1, 7.5], [97.4, 37.1]],
      'Madhya Pradesh': [[74.0, 21.0], [82.8, 26.9]],
      'Delhi': [[76.8, 28.4], [77.4, 28.9]],
      'Maharashtra': [[72.6, 15.6], [80.9, 22.0]],
      'Karnataka': [[74.0, 11.5], [78.6, 18.5]],
      'Rajasthan': [[69.4, 23.0], [78.3, 30.2]],
      'Uttar Pradesh': [[77.0, 23.8], [84.7, 30.5]],
      'Gujarat': [[68.1, 20.1], [74.5, 24.7]]
    };

    const bounds = stateBounds[selectedState] || stateBounds['National'];

    map.current.fitBounds(bounds, {
      padding: 50,
      duration: 2000,
      essential: true
    });
   }, [selectedState]);

  // 🛰️ TACTICAL TARGET LOCK ENGINE
  useEffect(() => {
    if (!map.current || !selectedAlertId) return;
    const target = [...activeAlerts, ...(activeJourneys || [])].find(a => a.id === selectedAlertId);
    if (target) {
      const lat = target.latitude || target.lat || target.location?.latitude || target.location?.lat || target.lastLocation?.latitude || target.lastLocation?.lat;
      const lng = target.longitude || target.lng || target.location?.longitude || target.location?.lng || target.lastLocation?.longitude || target.lastLocation?.lng;
      
      if (lat && lng) {
        // 🛰️ Initial FlyTo or Continuous EaseTo
        const center = [lng, lat] as [number, number];
        const isFirstLock = !map.current.isMoving(); // Check if we are already following

        if (isFirstLock) {
          map.current.flyTo({
            center,
            zoom: 17.5,
            pitch: 65,
            duration: 3000,
            essential: true
          });
        } else {
          map.current.easeTo({
            center,
            duration: 1000,
            easing: (t: number) => t // Linear follow
          });
        }
      }
    }
  }, [selectedAlertId, activeAlerts, activeJourneys]);

  // 📍 SYNC MARKERS
  useEffect(() => {
    const mb = (window as any).mapboxgl;
    if (!map.current || !mb) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 🔴 SOS MARKERS
    const uniqueAlertMap = new Map();
    [...(activeAlerts || [])]
      .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
      .forEach(alert => {
        const uid = alert.victimUid || alert.id;
        if (!uniqueAlertMap.has(uid)) {
          uniqueAlertMap.set(uid, alert);
        }
      });
    const uniqueAlerts = Array.from(uniqueAlertMap.values());

    uniqueAlerts.forEach(alert => {
      const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
      const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
      if (!lat || !lng) return;

      const isSuperCell = alert.status === 'supercell_dispatched';
      const isVerified = alert.isHandshakeVerified;

      // 🚨 VICTIM MARKER
      const el = document.createElement('div');
      el.className = isSuperCell ? 'marker-sos-supercell' : 'marker-sos';
      el.onclick = () => {
        onAlertClick?.(alert.id);
        map.current.flyTo({
           center: [lng, lat],
           zoom: 17.5,
           pitch: 65,
           duration: 2500,
           essential: true
        });
      };
      
      const marker = new mb.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mb.Popup().setHTML(`
          <div style="font-size: 9px; min-width: 120px;">
            <p style="font-weight: 900; color: ${isSuperCell ? '#7C3AED' : '#ef4444'}; text-transform: uppercase; margin: 0;">
              ${isSuperCell ? '🚨 SuperCell Dispatch' : 'Emergency SOS'}
            </p>
            <p style="font-weight: 700; color: #ffffff; margin: 2px 0;">${alert.victimName || 'User'}</p>
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
               <div style="width: 6px; height: 6px; border-radius: 50%; background: ${isVerified ? '#10b981' : '#f59e0b'};"></div>
               <p style="color: ${isVerified ? '#10b981' : '#f59e0b'}; font-weight: 900; font-size: 7px; text-transform: uppercase; margin: 0;">
                 Handshake: ${isVerified ? 'VERIFIED' : 'PENDING'}
               </p>
            </div>
            ${alert.activeResponders ? `<p style="color: #3b82f6; font-weight: 900; font-size: 7px; text-transform: uppercase; margin-top: 4px;">Surveillance: ${alert.activeResponders.length} Units Active</p>` : ''}
          </div>
        `))
        .addTo(map.current);
      markersRef.current.push(marker);

      // 🛡️ ACTIVE RESPONDER SURVEILLANCE
      if (alert.activeResponders && Array.isArray(alert.activeResponders)) {
        alert.activeResponders.forEach((responder: any) => {
          // Note: In a real scenario, we'd fetch the responder's live location from a global 'protectors' list
          // For now, we simulate their surveillance if we have their last known location or path
          if (responder.lastLocation) {
            const rEl = document.createElement('div');
            rEl.className = 'marker-protector-active';
            rEl.style.transform = 'scale(0.8)';
            rEl.onclick = () => {
              map.current.flyTo({
                 center: [responder.lastLocation.lng, responder.lastLocation.lat],
                 zoom: 17.5,
                 pitch: 65,
                 duration: 2500,
                 essential: true
              });
            };
            
            const rMarker = new mb.Marker(rEl)
              .setLngLat([responder.lastLocation.lng, responder.lastLocation.lat])
              .setPopup(new mb.Popup().setHTML(`
                <div style="font-size: 8px;">
                  <p style="font-weight: 900; color: #3B82F6; text-transform: uppercase; margin: 0;">SuperCell Surveillance</p>
                  <p style="font-weight: 700; color: #ffffff; margin: 2px 0;">ID: ${responder.name}</p>
                  <p style="color: #10b981; font-weight: 900; font-size: 7px; text-transform: uppercase; margin-top: 1px;">TASK: ${alert.victimName} INTERCEPT</p>
                </div>
              `))
              .addTo(map.current);
            markersRef.current.push(rMarker);
          }
        });
      }
    });

    // 🔵 ACTIVE PROTECTORS
    (activeProtectors || []).forEach(p => {
      const lat = p.latitude || p.lat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
      const lng = p.longitude || p.lng || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      if (!lat || !lng) return;

      const occupation = p.protectorVetting?.occupation || '';
      const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police', 'Doctor'].some(o => 
        occupation.toLowerCase().includes(o.toLowerCase())
      );
      
      const el = document.createElement('div');
      el.className = isElite ? 'marker-protector-elite' : 'marker-protector-active';
      el.onclick = () => {
        map.current.flyTo({
           center: [lng, lat],
           zoom: 17.5,
           pitch: 65,
           duration: 2500,
           essential: true
        });
      };
      
      const marker = new mb.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mb.Popup().setHTML(`
          <div style="font-size: 9px;">
            <p style="font-weight: 900; color: ${isElite ? '#F59E0B' : '#3B82F6'}; text-transform: uppercase; margin: 0;">
              ${isElite ? 'Elite Operative' : 'Verified Protector'}
            </p>
            <p style="font-weight: 700; color: #ffffff; margin: 2px 0;">${p.name || 'Operative'}</p>
            ${occupation ? `<p style="color: ${isElite ? '#F59E0B' : '#3B82F6'}; font-weight: 900; font-size: 7px; text-transform: uppercase; margin-top: 1px;">Sector: ${occupation}</p>` : ''}
          </div>
        `))
        .addTo(map.current);
      markersRef.current.push(marker);
    });

    // 🟢 FIR MARKERS - JUSTICE GREEN
    (activeFirs || []).forEach(fir => {
      const loc = fir.location || fir.incidentLocation;
      const lat = fir.latitude || fir.lat || loc?.latitude || loc?.lat;
      const lng = fir.longitude || fir.lng || loc?.longitude || loc?.lng;
      if (!lat || !lng) return;

      const el = document.createElement('div');
      el.className = 'marker-fir';
      el.onclick = () => {
        map.current.flyTo({
           center: [lng, lat],
           zoom: 17.5,
           pitch: 65,
           duration: 2500,
           essential: true
        });
      };
      
      const marker = new mb.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mb.Popup().setHTML(`
          <div style="font-size: 9px;">
            <p style="font-weight: 900; color: #10b981; text-transform: uppercase; margin: 0;">Justice Ledger FIR</p>
            <p style="font-weight: 700; color: #ffffff; margin: 2px 0;">Case: ${fir.id.slice(0, 8).toUpperCase()}</p>
            <p style="color: #94a3b8; margin: 0;">${fir.userName || fir.name || 'Unknown'}</p>
          </div>
        `))
        .addTo(map.current);
      markersRef.current.push(marker);
    });

    // ⚡ UPDATE LIVE PURSUIT LINES (COMET TAIL STYLE)
    if (map.current && map.current.getSource('route-line')) {
      const journeyFeatures = (activeJourneys || [])
        .filter(j => j.path && j.path.length > 1)
        .map(j => ({
          type: 'Feature',
          properties: { status: j.status, type: 'journey' },
          geometry: { 
            type: 'LineString', 
            coordinates: j.path.map((p: any) => 
              Array.isArray(p) ? p : [p.lng, p.lat]
            ) 
          }
        }));

      const alertFeatures = (activeAlerts || [])
        .filter(a => a.path && a.path.length > 1)
        .map(a => ({
          type: 'Feature',
          properties: { status: 'emergency', type: 'sos' },
          geometry: { 
            type: 'LineString', 
            coordinates: a.path.map((p: any) => 
              Array.isArray(p) ? p : [p.lng, p.lat]
            ) 
          }
        }));

      // 🏹 TACTICAL RESCUE VECTOR (Line from Protector to Victim)
      const vectorFeatures: any[] = [];
      if (selectedAlertId) {
        const activeMission = activeAlerts.find(a => a.id === selectedAlertId);
        if (activeMission && activeMission.status === 'responding' && activeMission.responderUid) {
          const victimLat = activeMission.latitude || activeMission.location?.latitude || activeMission.location?.lat;
          const victimLng = activeMission.longitude || activeMission.location?.longitude || activeMission.location?.lng;
          
          const responder = activeProtectors.find(p => (p.uid || p.id) === activeMission.responderUid);
          const responderLat = responder?.latitude || responder?.lat || responder?.lastLocation?.latitude || responder?.lastLocation?.lat || responder?.location?.latitude || responder?.location?.lat;
          const responderLng = responder?.longitude || responder?.lng || responder?.lastLocation?.longitude || responder?.lastLocation?.lng || responder?.location?.longitude || responder?.location?.lng;

          if (victimLat && victimLng && responderLat && responderLng) {
            vectorFeatures.push({
              type: 'Feature',
              properties: { status: 'intercept', type: 'vector' },
              geometry: {
                type: 'LineString',
                coordinates: [[responderLng, responderLat], [victimLng, victimLat]]
              }
            });
          }
        }
      }

      map.current.getSource('route-line').setData({
        type: 'FeatureCollection',
        features: [...journeyFeatures, ...alertFeatures, ...vectorFeatures]
      });

      // 🔴 RED TAIL FOR EMERGENCY | 🔵 BLUE TAIL FOR NORMAL | 🟡 GOLD FOR INTERCEPT
      map.current.setPaintProperty('route-path', 'line-color', [
        'case',
        ['==', ['get', 'status'], 'emergency'], '#FF0000',
        ['==', ['get', 'status'], 'intercept'], '#F59E0B',
        '#3B82F6'
      ]);
      
      map.current.setPaintProperty('route-path', 'line-dasharray', [
        'case',
        ['==', ['get', 'status'], 'intercept'], ['literal', [2, 2]],
        ['literal', [1, 1]]
      ]);
    }

    // 🚗 TRANSIT MARKERS - VEHICLE BLUE
    (activeJourneys || []).forEach(j => {
      const lat = j.latitude || j.lat || j.location?.latitude || j.location?.lat || j.lastLocation?.latitude || j.lastLocation?.lat;
      const lng = j.longitude || j.lng || j.location?.longitude || j.location?.lng || j.lastLocation?.longitude || j.lastLocation?.lng;
      if (!lat || !lng) return;

      const el = document.createElement('div');
      const isEmergency = j.status === 'emergency';
      const pulseColor = isEmergency ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.2)';
      const pulseBorder = isEmergency ? 'border-red-500/40' : 'border-blue-500/20';

      el.className = 'marker-transit';
      el.innerHTML = `
        <div class="relative w-full h-full flex items-center justify-center" style="perspective: 1000px;">
          <!-- 🌑 TACTICAL GROUND SHADOW -->
          <div class="absolute w-5 h-3 bg-black/30 rounded-full blur-[2px]" style="transform: translateY(8px) rotateX(60deg);"></div>
          
          <!-- 🚗 REALISTIC ISOMETRIC CAR SVG -->
          <div class="relative z-10 transform-gpu transition-all duration-300 hover:scale-110" style="transform: rotateX(15deg) rotateZ(0deg);">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Chassis -->
              <path d="M42 32C42 34.2091 40.2091 36 38 36H10C7.79086 36 6 34.2091 6 32V26C6 23.7909 7.79086 22 10 22H38C40.2091 22 42 23.7909 42 26V32Z" fill="${isEmergency ? '#EF4444' : '#2563EB'}"/>
              <!-- Roof / Cabin -->
              <path d="M12 22L16 14H32L36 22H12Z" fill="${isEmergency ? '#F87171' : '#3B82F6'}"/>
              <!-- Windows -->
              <path d="M17 15H31L34 21H14L17 15Z" fill="#93C5FD" fill-opacity="0.6"/>
              <!-- Wheels -->
              <rect x="10" y="34" width="6" height="4" rx="1" fill="#1E293B"/>
              <rect x="32" y="34" width="6" height="4" rx="1" fill="#1E293B"/>
              <!-- Headlights -->
              <circle cx="8" cy="28" r="2" fill="white" fill-opacity="0.8"/>
              <circle cx="40" cy="28" r="2" fill="white" fill-opacity="0.8"/>
            </svg>
          </div>
          
          <!-- 📡 NEURAL PULSE -->
          <div class="absolute inset-0 border-2 ${pulseBorder} rounded-full animate-ping opacity-60" style="background: ${pulseColor}"></div>
        </div>
      `;
      el.onclick = () => {
        map.current.flyTo({
           center: [lng, lat],
           zoom: 17.5,
           pitch: 65,
           duration: 2500,
           essential: true
        });
      };
      
      const marker = new mb.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mb.Popup().setHTML(`
          <div style="font-size: 9px;">
            <p style="font-weight: 900; color: #3B82F6; text-transform: uppercase; margin: 0;">Active Transit</p>
            <p style="font-weight: 700; color: #ffffff; margin: 2px 0;">Vehicle: ${j.vehicleNo}</p>
            <p style="color: #94a3b8; margin: 0;">User: ${j.userName || 'Passenger'}</p>
            <p style="font-weight: 900; color: #10b981; font-size: 7px; text-transform: uppercase; margin-top: 1px;">Status: ${j.status || 'On-Route'}</p>
          </div>
        `))
        .addTo(map.current);
      markersRef.current.push(marker);
    });

  }, [activeAlerts, activeProtectors, activeFirs, activeJourneys]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
