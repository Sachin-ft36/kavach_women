import { useEffect, MutableRefObject } from 'react';
import { fetchRouteMappls } from '../../services/MapplsService';

export function useMapboxRoute(
  mapRef: MutableRefObject<any>,
  isMapLoaded: boolean,
  selectedAlertId: string | null | undefined,
  activeAlerts: any[],
  activeProtectors: any[],
  activeJourneys: any[]
) {
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !mapRef.current.getSource('intercept-route')) return;

    let routeFetched = false;
    let startCoords: [number, number] | null = null;
    let endCoords: [number, number] | null = null;

    if (selectedAlertId) {
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
        if (!mapRef.current || !mapRef.current.getSource('intercept-route')) return;

        let finalCoordinates: [number, number][] = [];
        if (routePath && routePath.length > 0) {
          finalCoordinates = routePath;
        } else {
          finalCoordinates = [startCoords!, endCoords!];
        }

        mapRef.current.getSource('intercept-route').setData({
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

        if (finalCoordinates.length > 1 && mapRef.current) {
          const mb = (window as any).mapboxgl;
          if (mb) {
            const bounds = new mb.LngLatBounds();
            finalCoordinates.forEach(coord => bounds.extend(coord));
            mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 1500 });
          }
        }
      });
    } else {
      mapRef.current.getSource('intercept-route').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [selectedAlertId, activeAlerts, activeProtectors, activeJourneys, isMapLoaded]);
}
