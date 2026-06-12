import { useEffect, useRef } from 'react';
import { fetchRouteMappls } from '../../../services/MapplsService';

export function useSafeHavenSync(
  mapRef: React.MutableRefObject<any>,
  isLoaded: boolean,
  userPos: { lat: number; lng: number } | null,
  policeStations: any[],
  protectors: any[],
  activeFilter: 'all' | 'police' | 'pcr' | 'civilian',
  targetPoint: any,
  setTargetPoint: React.Dispatch<React.SetStateAction<any>>,
  isNavigating: boolean,
  isCameraLocked: boolean
) {
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const directionPluginRef = useRef<any>(null);
  const prevTargetRef = useRef<any>(null);

  // Render Markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userPos) return;
    const Mappls = (window as any).mappls;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (activeFilter === 'all' || activeFilter === 'police') {
      policeStations.forEach(station => {
        if (!station.lat || !station.lng) return;
        const marker = new Mappls.Marker({
          map: mapRef.current,
          position: { lat: station.lat, lng: station.lng },
          html: `<div class="tactical-marker police">🚨</div>`,
          width: 32, height: 32, offset: [16, 16]
        });
        marker.addListener('click', () => {
          setTargetPoint({ lat: station.lat, lng: station.lng, name: station.name, type: 'police', dist: station.dist });
        });
        markersRef.current.push(marker);
      });
    }

    protectors.forEach(p => {
      if (!p.coords) return;
      const isPCR = p.protectorVetting?.occupation?.toLowerCase().includes('police');
      
      if (activeFilter !== 'all') {
         if (activeFilter === 'pcr' && !isPCR) return;
         if (activeFilter === 'civilian' && isPCR) return;
         if (activeFilter === 'police') return;
      }

      const marker = new Mappls.Marker({
        map: mapRef.current,
        position: { lat: p.coords[0], lng: p.coords[1] },
        html: `<div class="tactical-marker ${isPCR ? 'pcr' : 'protector'}">${isPCR ? '🚓' : '🛡️'}</div>`,
        width: 32, height: 32, offset: [16, 16]
      });
      marker.addListener('click', () => {
        setTargetPoint({ lat: p.coords[0], lng: p.coords[1], name: isPCR ? 'PCR Van' : (p.name || 'Protector'), type: 'protector', dist: 'LIVE' });
      });
      markersRef.current.push(marker);
    });

  }, [isLoaded, policeStations, protectors, activeFilter, setTargetPoint, userPos]);

  // Handle User Marker
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userPos) return;
    const Mappls = (window as any).mappls;
    const isNavMode = !!targetPoint;
    
    if (isNavMode) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const markerHTML = `<div class="pulse-marker-victim"></div>`;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new Mappls.Marker({
        map: mapRef.current,
        position: { lat: userPos.lat, lng: userPos.lng },
        html: markerHTML,
        width: 36, height: 36, offset: [18, 18]
      });
    } else {
      userMarkerRef.current.setPosition({ lat: userPos.lat, lng: userPos.lng });
      if (userMarkerRef.current.getPopup() || true) {
         const el = userMarkerRef.current._element;
         if (el && el.innerHTML !== markerHTML) {
            el.innerHTML = markerHTML;
         }
      }
    }
  }, [isLoaded, userPos, targetPoint]);

  // Handle Routing
  useEffect(() => {
    if (!targetPoint || !userPos || !isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    const isNewTarget = !prevTargetRef.current || prevTargetRef.current.lat !== targetPoint.lat || prevTargetRef.current.lng !== targetPoint.lng;

    if (isNewTarget) {
      if (directionPluginRef.current) {
        try {
          if (typeof directionPluginRef.current.remove === 'function') directionPluginRef.current.remove();
        } catch (e) {}
        directionPluginRef.current = null;
      }
      prevTargetRef.current = targetPoint;
    }

    if (mapRef.current.getLayer('custom-route-layer')) mapRef.current.removeLayer('custom-route-layer');
    if (mapRef.current.getLayer('custom-route-layer-outline')) mapRef.current.removeLayer('custom-route-layer-outline');
    if (mapRef.current.getSource('custom-route-source')) mapRef.current.removeSource('custom-route-source');

    if (!directionPluginRef.current) {
      try {
        Mappls.tracking({
          map: mapRef.current,
          start: { geoposition: `${userPos.lat},${userPos.lng}` },
          end: { geoposition: `${targetPoint.lat},${targetPoint.lng}` },
          strokeWidth: 0,
          routeColor: "transparent",
          ccpIconWidth: 70,
          profile: 'driving',
          resource: 'route_eta',
          traffic: false,
          alternatives: false,
          fitBounds: !isNavigating,
          sPopup: "", dPopup: "",
          start_icon: "", end_icon: "",
        }, function (data: any) {
          directionPluginRef.current = data;
          if (isNavigating && data && data.trackingCall) {
            try {
              data.trackingCall({
                location: [userPos.lng, userPos.lat],
                heading: isCameraLocked,
                mapCenter: isCameraLocked,
                buffer: 50, delay: 2000, fitBounds: false
              });
            } catch (e) {
              console.warn("Mappls trackingCall failed:", e);
            }
          }
        });
      } catch (err) {
        console.error("Mappls tracking plugin crashed:", err);
      }
    } else if (directionPluginRef.current.trackingCall) {
      try {
        directionPluginRef.current.trackingCall({
          location: [userPos.lng, userPos.lat],
          reRoute: true,
          heading: isNavigating && isCameraLocked,
          mapCenter: isNavigating && isCameraLocked,
          buffer: 50,
          delay: 2000,
          fitBounds: false
        });
      } catch (e) {
        console.warn("Mappls trackingCall failed during update:", e);
      }
    }

    fetchRouteMappls(userPos.lng, userPos.lat, targetPoint.lng, targetPoint.lat)
      .then(coords => {
        if (coords && coords.length > 0 && mapRef.current) {
          const routeGeoJSON = {
            type: 'LineString',
            coordinates: coords
          };
          const map = mapRef.current;
          const sourceId = 'custom-route-source';
          const layerId = 'custom-route-layer';

          if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData(routeGeoJSON);
          } else {
            map.addSource(sourceId, { type: 'geojson', data: routeGeoJSON });
            
            map.addLayer({
              id: layerId + '-outline', type: 'line', source: sourceId,
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': targetPoint.type === 'police' ? '#1E40AF' : '#047857', 'line-width': 8, 'line-opacity': 0.6 }
            });
            
            map.addLayer({
              id: layerId, type: 'line', source: sourceId,
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': targetPoint.type === 'police' ? '#3B82F6' : '#10B981', 'line-width': 5, 'line-opacity': 1 }
            });
          }
        }
      })
      .catch(err => console.warn("🚨 Fallback Route drawing failed:", err));

  }, [targetPoint, userPos, isLoaded, isNavigating, isCameraLocked]);
}
