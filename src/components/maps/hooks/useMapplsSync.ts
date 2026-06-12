import { useEffect, useRef } from 'react';
import { useKavachStore } from '../../../store/useKavachStore';
import { drawMapplsRadiusCircle } from './sync_modules/drawMapplsRadiusCircle';
import { drawMapplsVictimTarget } from './sync_modules/drawMapplsVictimTarget';
import { handleMapplsTracking } from './sync_modules/handleMapplsTracking';
import { handleMapplsHybridRide } from './sync_modules/handleMapplsHybridRide';

export function useMapplsSync(
  mapRef: React.MutableRefObject<any>,
  isLoaded: boolean,
  userPos: { lat: number; lng: number } | null,
  activeAlert: any,
  isNavigating: boolean
) {
  const userMarkerRef = useRef<any>(null);
  const victimMarkerRef = useRef<any>(null);
  const directionPluginRef = useRef<any>(null);
  const ridePolylineRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userPos) return;
    const Mappls = (window as any).mappls;
    const uCoords = { lat: userPos.lat, lng: userPos.lng };

    // User Marker Update
    if (!userMarkerRef.current) {
      userMarkerRef.current = new Mappls.Marker({
        map: mapRef.current,
        position: uCoords,
        html: `<div class="pulse-marker-protector"></div>`,
        width: 36, height: 36,
        offset: [0, 0]
      });

      setTimeout(() => {
        if (mapRef.current) {
          if (typeof mapRef.current.resize === 'function') mapRef.current.resize();
          mapRef.current.setCenter(uCoords);
          mapRef.current.setZoom(11);
        }
      }, 300);
    } else {
      userMarkerRef.current.setPosition(uCoords);
      if (mapRef.current) {
        mapRef.current.setCenter(uCoords);
      }
    }

    // 5KM RADIUS CIRCLE (GeoJSON Method)
    drawMapplsRadiusCircle(mapRef.current, userPos.lat, userPos.lng, 5);

    if (isNavigating) {
      mapRef.current.setCenter(uCoords);
      mapRef.current.setZoom(18);
    }

    if (activeAlert) {
      const vLat = activeAlert.latitude || activeAlert.location?.latitude || activeAlert.location?.lat;
      const vLng = activeAlert.longitude || activeAlert.location?.longitude || activeAlert.location?.lng;
      const vEloc = activeAlert.mapplsId || activeAlert.mappls_id;

      const routingLat = activeAlert.location?.routingLat || vLat;
      const routingLng = activeAlert.location?.routingLng || vLng;

      if (vLat && vLng) {
        const vCoords = vEloc ? { eloc: vEloc } : { lat: vLat, lng: vLng };

        if (!victimMarkerRef.current) {
          victimMarkerRef.current = new Mappls.Marker({
            map: mapRef.current,
            position: vCoords,
            html: `<div class="pulse-marker-victim"></div>`,
            width: 50, height: 50,
            offset: [0, 0]
          });
        } else {
          victimMarkerRef.current.setPosition(vCoords);
        }

        if (routingLat && routingLng) {
          drawMapplsVictimTarget(mapRef.current, routingLat, routingLng);
        }

        handleMapplsTracking(
          mapRef.current, userPos, routingLat, routingLng,
          isNavigating, Mappls, directionPluginRef
        );
      }
    }

    const { isRideModeActive, rideData } = useKavachStore.getState();
    handleMapplsHybridRide(
      mapRef.current, userPos, isRideModeActive, rideData,
      ridePolylineRef, isNavigating, Mappls
    );
  }, [userPos, activeAlert, isLoaded, isNavigating, useKavachStore.getState().rideData?.targetCoords]);

  return { userMarkerRef, victimMarkerRef, directionPluginRef, ridePolylineRef };
}
