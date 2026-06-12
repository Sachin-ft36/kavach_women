import { useEffect, MutableRefObject, useRef } from 'react';

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

export function useMapboxMarkers(
  mapRef: MutableRefObject<any>,
  isMapLoaded: boolean,
  activeAlerts: any[],
  activeProtectors: any[],
  activeJourneys: any[],
  selectedAlertId: string | null | undefined,
  selectedProtectorId: string | null | undefined,
  onAlertClick?: (id: string) => void
) {
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const mb = (window as any).mapboxgl;
    if (!mapRef.current || !mb || !isMapLoaded) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    activeAlerts.forEach(alert => {
      const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
      const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
      if (!lat || !lng) return;

      const isSelected = selectedAlertId === alert.id;
      const el = document.createElement('div');
      el.className = 'marker-sos';
      el.style.zIndex = isSelected ? '500' : '100';
      el.onclick = () => onAlertClick?.(alert.id);

      const marker = new mb.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    if (selectedAlertId && mapRef.current) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      const journey = activeJourneys.find(j => j.id === selectedAlertId || j.userId === selectedAlertId);

      if (alert) {
        const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
        const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;

        if (lat && lng) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 14, pitch: 45, duration: 2000 });
          const radiusGeoJSON = createGeoJSONCircle([lng, lat], 2);
          const updateRadius = () => {
            if (mapRef.current.getSource('selected-radius')) {
              mapRef.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [radiusGeoJSON] });
              mapRef.current.setPaintProperty('radius-circle', 'fill-color', '#EF4444');
              mapRef.current.setPaintProperty('radius-circle', 'fill-opacity', 0.2);
              mapRef.current.setPaintProperty('radius-outline', 'line-color', '#EF4444');
              mapRef.current.setPaintProperty('radius-outline', 'line-width', 2);

              if (mapRef.current.getLayer('radius-circle')) mapRef.current.moveLayer('radius-circle');
              if (mapRef.current.getLayer('radius-outline')) mapRef.current.moveLayer('radius-outline');
            }
          };

          if (mapRef.current.isStyleLoaded()) updateRadius();
          else mapRef.current.once('styledata', updateRadius);
        }
      } else if (journey) {
        const lat = journey.latitude || journey.lat || journey.lastLat || journey.currentLat || journey.location?.latitude || journey.location?.lat;
        const lng = journey.longitude || journey.lng || journey.lastLng || journey.currentLng || journey.long || journey.location?.longitude || journey.location?.lng;

        if (lat && lng) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 2000 });
          const radiusGeoJSON = createGeoJSONCircle([lng, lat], 1.2);
          const updateRadius = () => {
            if (mapRef.current.getSource('selected-radius')) {
              mapRef.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [radiusGeoJSON] });
              mapRef.current.setPaintProperty('radius-circle', 'fill-color', '#06B6D4');
              mapRef.current.setPaintProperty('radius-circle', 'fill-opacity', 0.15);
              mapRef.current.setPaintProperty('radius-outline', 'line-color', '#06B6D4');
              mapRef.current.setPaintProperty('radius-outline', 'line-width', 1.5);

              if (mapRef.current.getLayer('radius-circle')) mapRef.current.moveLayer('radius-circle');
              if (mapRef.current.getLayer('radius-outline')) mapRef.current.moveLayer('radius-outline');
            }
          };

          if (mapRef.current.isStyleLoaded()) updateRadius();
          else mapRef.current.once('styledata', updateRadius);
        }
      }
    } else if (mapRef.current && mapRef.current.getSource('selected-radius')) {
      mapRef.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [] });
    }

    activeProtectors.forEach(p => {
      const isVictim = activeAlerts.some(a =>
        (a.userId === p.id || a.id === p.id || a.phone === p.phone || a.phoneNumber === p.phoneNumber) &&
        (a.status === 'active' || a.status === 'responding' || a.status === 'Responding' || a.status === 'ACTIVE')
      );
      if (isVictim) return;

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
      el.style.zIndex = isSelected ? '1000' : '200';

      const marker = new mb.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    activeJourneys.forEach(j => {
      const lat = j.latitude || j.lat || j.lastLat || j.currentLat || j.location?.latitude || j.location?.lat;
      const lng = j.longitude || j.lng || j.lastLng || j.currentLng || j.long || j.location?.longitude || j.location?.lng;

      if (!lat || !lng) return;
      const isSelected = selectedAlertId === j.id || selectedAlertId === j.userId;

      const el = document.createElement('div');
      el.className = isSelected ? 'marker-transit marker-transit-active' : 'marker-transit';
      el.style.zIndex = isSelected ? '800' : '150';

      markersRef.current.push(new mb.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current));
    });

    if (selectedProtectorId) {
      const p = activeProtectors.find(p => p.id === selectedProtectorId);
      if (p) {
        const lat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
        const lng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
        if (lat && lng) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 2000 });
        }
      }
    }

    if (!selectedAlertId && !selectedProtectorId && mapRef.current.getSource('selected-radius')) {
      mapRef.current.getSource('selected-radius').setData({ type: 'FeatureCollection', features: [] });
    }

  }, [activeAlerts, activeProtectors, activeJourneys, selectedAlertId, selectedProtectorId, isMapLoaded, onAlertClick]);
}
