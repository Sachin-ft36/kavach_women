import React, { useEffect, useRef, memo } from 'react';

const mapboxgl = (window as any).mapboxgl;
const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

const CommandMap = memo(({ activeAlerts = [], activeProtectors = [], centerOverride = null, showVectors = false }: { activeAlerts?: any[], activeProtectors?: any[], centerOverride?: [number, number] | null, showVectors?: boolean }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  
  const alertMarkers = useRef<{ [key: string]: any }>({});
  const protectorMarkers = useRef<{ [key: string]: any }>({});
  const interceptLines = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const initMap = () => {
      const mb = (window as any).mapboxgl;
      if (!mapContainer.current || !mb || !mb.Map) {
        setTimeout(initMap, 500);
        return;
      }

      mb.accessToken = MAPBOX_TOKEN;
      const VIEW_BOUNDS: [[number, number], [number, number]] = [[60.0, 0.0], [105.0, 42.0]];

      map.current = new mb.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: centerOverride ? [centerOverride[1], centerOverride[0]] : [82.0, 22.0], 
        zoom: centerOverride ? 12 : 3.3, 
        maxBounds: VIEW_BOUNDS, 
        pitch: 0, // Flat national view is clearer for oversight
        antialias: true
      });

      map.current.on('load', () => {
        if (!map.current.getLayer('state-outlines-custom')) {
          map.current.addLayer({
            'id': 'state-outlines-custom',
            'type': 'line',
            'source': 'composite',
            'source-layer': 'admin',
            'filter': ['all', ['==', 'admin_level', 1], ['==', 'maritime', 0]],
            'paint': {
              'line-color': 'rgba(0, 112, 243, 0.2)',
              'line-width': 1,
              'line-dasharray': [2, 2]
            }
          });
        }
      });
    };
    initMap();
    return () => {
      Object.values(alertMarkers.current).forEach(m => m.remove());
      Object.values(protectorMarkers.current).forEach(m => m.remove());
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !showVectors) return;

    activeAlerts.forEach(alert => {
      if (!alert.location || !alert.responders) return;
      
      alert.responders.forEach((resp: any, idx: number) => {
        const lineId = `line-${alert.id}-${resp.uid || idx}`;
        const protector = activeProtectors.find(p => p.uid === resp.uid || p.id === resp.uid);
        if (!protector || !protector.lastLocation) return;

        const coordinates = [
          [protector.lastLocation.lng, protector.lastLocation.lat],
          [alert.location.longitude, alert.location.latitude]
        ];

        try {
          if (map.current.getSource(lineId)) {
            map.current.getSource(lineId).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates } });
          } else {
            map.current.addSource(lineId, {
              type: 'geojson',
              data: { type: 'Feature', geometry: { type: 'LineString', coordinates } }
            });
            map.current.addLayer({
              'id': lineId,
              'type': 'line',
              'source': lineId,
              'layout': { 'line-join': 'round', 'line-cap': 'round' },
              'paint': { 'line-color': '#00f2ff', 'line-width': 2, 'line-dasharray': [3, 2], 'line-opacity': 0.6 }
            });
            interceptLines.current[lineId] = true;
          }
        } catch (e) {}
      });
    });

    return () => {
      Object.keys(interceptLines.current).forEach(id => {
        if (map.current?.getLayer(id)) map.current.removeLayer(id);
        if (map.current?.getSource(id)) map.current.removeSource(id);
      });
      interceptLines.current = {};
    };
  }, [activeAlerts, activeProtectors, showVectors]);

  useEffect(() => {
    if (!map.current || !mapboxgl) return;

    const activeAlertIds = activeAlerts.map(a => a.id);
    Object.keys(alertMarkers.current).forEach(id => {
      if (!activeAlertIds.includes(id)) {
        alertMarkers.current[id].remove();
        delete alertMarkers.current[id];
      }
    });

    activeAlerts.forEach(alert => {
      if (!alert.location || typeof alert.location.latitude !== 'number' || typeof alert.location.longitude !== 'number') return;
      const coords: [number, number] = [alert.location.longitude, alert.location.latitude];
      if (!alertMarkers.current[alert.id]) {
        const el = document.createElement('div');
        el.className = 'sos-pulse-marker';
        el.innerHTML = `
          <div style="position: relative;">
            <div style="position: absolute; inset: -15px; background: rgba(255,0,0,0.4); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
            <div style="background: #ff0000; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 30px #ff0000; position: relative; z-index: 2;"></div>
          </div>
        `;

        const isStale = alert.isStale;
        // 🛡️ TACTICAL HOVER POPUP (SOS)
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'tactical-popup' })
          .setHTML(`
            <div style="background: #080808; border: 1px solid #ff0000; padding: 12px; border-radius: 12px; color: white; font-family: sans-serif; min-width: 200px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                 <span style="font-size: 8px; font-weight: 900; color: #ff0000; text-transform: uppercase; letter-spacing: 2px;">${isStale ? '⚠️ SIGNAL LOST / OFFLINE' : '⚠️ CRITICAL SOS'}</span>
                 <span style="font-size: 8px; color: grey;">UID: ${alert.id.slice(-6).toUpperCase()}</span>
              </div>
              <h4 style="margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase;">${alert.victimName}</h4>
              <p style="margin: 4px 0; font-size: 9px; color: #555; text-transform: uppercase;">
                ${alert.state || 'UNKNOWN'} • 
                ${alert.location?.latitude?.toFixed(4) || '0.0000'}, 
                ${alert.location?.longitude?.toFixed(4) || '0.0000'}
              </p>
              ${isStale ? `<p style="color: #ff0000; font-size: 7px; font-weight: bold; text-transform: uppercase; margin: 4px 0;">⚠️ CRITICAL: Mission Telemetry Heartbeat Failed</p>` : ''}
              <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 8px 0;"></div>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                 <span style="background: rgba(255,0,0,0.1); color: #ff0000; padding: 2px 6px; border-radius: 4px; font-size: 7px; font-weight: 900;">${alert.type || 'SENSORY'}</span>
                 <span style="background: rgba(0,112,243,0.1); color: #0070f3; padding: 2px 6px; border-radius: 4px; font-size: 7px; font-weight: 900;">RESP: ${alert.responders?.length || 0}</span>
              </div>
            </div>
          `);

        const marker = new mapboxgl.Marker(el).setLngLat(coords).addTo(map.current!);
        
        // HOVER REGISTRY
        el.addEventListener('mouseenter', () => marker.setPopup(popup).togglePopup());
        el.addEventListener('mouseleave', () => marker.togglePopup());
        
        alertMarkers.current[alert.id] = marker;
      } else {
        if (!isNaN(coords[0]) && !isNaN(coords[1])) {
           alertMarkers.current[alert.id].setLngLat(coords);
        }
      }
    });

    // Protectors (Blue/Cyan Grid)
    const activeProtIds = activeProtectors.map(p => p.id || p.uid);
    Object.keys(protectorMarkers.current).forEach(id => {
      if (!activeProtIds.includes(id)) {
        protectorMarkers.current[id].remove();
        delete protectorMarkers.current[id];
      }
    });

    activeProtectors.forEach(p => {
      // 🛰️ MULTI-SOURCE COORDINATE RESOLUTION (Ensures visibility even if one source is stale)
      let lat = null;
      let lng = null;

      if (p.telemetry?.coords && typeof p.telemetry.coords[0] === 'number') {
        lat = p.telemetry.coords[0];
        lng = p.telemetry.coords[1];
      } else if (p.lastLocation && typeof p.lastLocation.lat === 'number') {
        lat = p.lastLocation.lat;
        lng = p.lastLocation.lng;
      } else if (p.coords && typeof p.coords[0] === 'number') {
        lat = p.coords[0];
        lng = p.coords[1];
      }

      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;
      const coords: [number, number] = [lng, lat];
      const pid = p.id || p.uid;
      const isOnMission = activeAlerts.some(a => a.responders?.some((r: any) => r.uid === pid));
      const signalLost = p.isStale;

      if (!protectorMarkers.current[pid]) {
        const el = document.createElement('div');
        el.className = 'protector-marker';
        el.innerHTML = `<div style="background: ${signalLost ? '#555' : (isOnMission ? '#00f2ff' : '#0070f3')}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px ${signalLost ? '#000' : (isOnMission ? '#00f2ff' : '#0070f3')}; transition: all 0.5s; opacity: ${signalLost ? 0.4 : 1};"></div>`;
        
        // 🛡️ TACTICAL HOVER POPUP (PROTECTOR)
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'tactical-popup' })
          .setHTML(`
            <div style="background: #080808; border: 1px solid ${signalLost ? '#555' : '#0070f3'}; padding: 12px; border-radius: 12px; color: white; font-family: sans-serif; min-width: 180px;">
              <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px;">
                 <div style="width: 6px; height: 6px; border-radius: 50%; background: ${signalLost ? '#555' : (isOnMission ? '#00f2ff' : '#0070f3')};"></div>
                 <span style="font-size: 8px; font-weight: 900; color: ${signalLost ? '#555' : '#0070f3'}; text-transform: uppercase;">⚡ ${signalLost ? 'SIGNAL LOST / APP DELETED' : (isOnMission ? 'ON MISSION' : 'ONLINE')}</span>
              </div>
              <h3 style="margin: 0; font-size: 14px; font-weight: 900;">${p.name || 'Anonymous Operative'}</h3>
              <p style="margin: 4px 0; font-size: 9px; color: #555;">UID: ${pid.slice(0, 10).toUpperCase()}</p>
              ${signalLost ? `<p style="color: #ff0000; font-size: 7px; font-weight: bold; text-transform: uppercase; margin-top: 4px;">⚠️ DEACTIVATED: Telemetry Heartbeat Failed</p>` : ''}
              <div style="display: flex; gap: 4px; margin-top: 8px;">
                 <span style="font-size: 7px; color: #0070f3; font-weight: 900;">Verified Security Score: 9.8</span>
              </div>
            </div>
          `);

        const marker = new mapboxgl.Marker(el).setLngLat(coords).addTo(map.current!);
        
        el.addEventListener('mouseenter', () => marker.setPopup(popup).togglePopup());
        el.addEventListener('mouseleave', () => marker.togglePopup());

        protectorMarkers.current[pid] = marker;
      } else {
        if (!isNaN(coords[0]) && !isNaN(coords[1])) {
          protectorMarkers.current[pid].setLngLat(coords);
        }
      }
    });
  }, [activeAlerts, activeProtectors]);

  useEffect(() => {
    if (map.current && centerOverride) {
      map.current.flyTo({ center: [centerOverride[1], centerOverride[0]], zoom: 15, essential: true, pitch: 60 });
    }
  }, [centerOverride]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-black">
       <div ref={mapContainer} className="absolute inset-0" />
       <style>{`
         @keyframes pulse-ring {
           0% { transform: scale(0.3); opacity: 1; }
           100% { transform: scale(3); opacity: 0; }
         }
       `}</style>
    </div>
  );
});

export default CommandMap;
