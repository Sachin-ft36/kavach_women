import { useEffect, useRef } from 'react';
import { useKavachStore } from '../../../state/useKavachStore';
import { drawMapplsRadiusCircle } from './sync_modules/drawMapplsRadiusCircle';
import { handleMapplsTracking } from './sync_modules/handleMapplsTracking';
import { handleMapplsHybridRide } from './sync_modules/handleMapplsHybridRide';

export function useMapplsSync(
  mapRef: React.MutableRefObject<any>,
  isLoaded: boolean,
  userPos: { lat: number; lng: number } | null,
  activeAlert: any,
  isNavigating: boolean,
  onVictimClick?: () => void,
  isCarHUD?: boolean,
  isProtectorHUD?: boolean
) {
  const userMarkerRef = useRef<any>(null);
  const victimMarkerRef = useRef<any>(null);
  const directionPluginRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
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
        html: `<div class="pulse-marker-protector" style="${isNavigating ? 'display: none;' : ''}"></div>`,
        width: 36, height: 36,
        offset: [0, 0]
      });

      setTimeout(() => {
        if (mapRef.current) {
          if (typeof mapRef.current.resize === 'function') mapRef.current.resize();
          mapRef.current.setCenter(uCoords);
          mapRef.current.setZoom(17);
        }
      }, 300);
    } else {
      userMarkerRef.current.setPosition(uCoords);
      const markerEl = userMarkerRef.current.getElement();
      if (markerEl) {
        const pulseEl = markerEl.querySelector('.pulse-marker-protector');
        if (pulseEl) pulseEl.style.display = isNavigating ? 'none' : 'block';
      }
      if (mapRef.current && !isNavigating) {
        mapRef.current.setCenter(uCoords);
      }
    }

    // 5KM RADIUS CIRCLE (GeoJSON Method)
    drawMapplsRadiusCircle(mapRef.current, userPos.lat, userPos.lng, 5);

    if (isNavigating) {
      // Let Mappls routing plugin handle centering and bounds.
    }

    if (activeAlert) {
      const vLat = activeAlert.latitude || activeAlert.location?.latitude || activeAlert.location?.lat;
      const vLng = activeAlert.longitude || activeAlert.location?.longitude || activeAlert.location?.lng;
      const vEloc = activeAlert.mapplsId || activeAlert.mappls_id;

      const routingLat = activeAlert.location?.routingLat || vLat;
      const routingLng = activeAlert.location?.routingLng || vLng;

      if (vLat && vLng) {
        // Place the red dot at the exact routing destination so the route line hits it perfectly
        const vCoords = { lat: routingLat, lng: routingLng };

        if (!victimMarkerRef.current) {
          victimMarkerRef.current = new Mappls.Marker({
            map: mapRef.current,
            position: vCoords,
            html: `<div class="pulse-marker-victim" style="cursor: pointer;"></div>`,
            width: 50, height: 50,
            offset: [0, 0]
          });
          if (onVictimClick) {
            victimMarkerRef.current.addListener('click', onVictimClick);
          }
        } else {
          victimMarkerRef.current.setPosition(vCoords);
        }

        if (!isProtectorHUD) {
          handleMapplsTracking(
            mapRef.current, userPos, routingLat, routingLng,
            isNavigating, Mappls, directionPluginRef, routePolylineRef, vEloc
          );
        }
      }
    }

    if (!isProtectorHUD) {
      const { isRideModeActive, rideData } = useKavachStore.getState();
      handleMapplsHybridRide(
        mapRef.current, userPos, isRideModeActive, rideData,
        ridePolylineRef, isNavigating, Mappls
      );
    }
  }, [userPos, activeAlert, isLoaded, isNavigating, useKavachStore.getState().rideData?.targetCoords, isProtectorHUD]);

  return { userMarkerRef, victimMarkerRef, directionPluginRef, ridePolylineRef };
}
