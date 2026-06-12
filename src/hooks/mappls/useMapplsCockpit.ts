import { useState, useEffect, MutableRefObject } from 'react';

export function useMapplsCockpit(
  mapRef: MutableRefObject<any>,
  isLoaded: boolean,
  activeAlerts: any[],
  activeProtectors: any[],
  selectedAlertId: string | null | undefined,
  userPos: any,
  commandCenterMarkerRef: MutableRefObject<any>,
  headingRef: MutableRefObject<number>,
  lastUserPosRef: MutableRefObject<number[]>
) {
  const [isCockpitMode, setIsCockpitMode] = useState(false);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !isCockpitMode) return;

    let carLat: number | null = null;
    let carLng: number | null = null;

    if (selectedAlertId) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      if (alert?.activeResponders?.length > 0) {
        carLat = alert.activeResponders[0].lastLocation?.lat || alert.activeResponders[0].lat || alert.activeResponders[0].latitude;
        carLng = alert.activeResponders[0].lastLocation?.lng || alert.activeResponders[0].lng || alert.activeResponders[0].longitude;
      }
    }

    if (!carLat || !carLng) {
      if (commandCenterMarkerRef.current && typeof commandCenterMarkerRef.current.getPosition === 'function') {
        const pos = commandCenterMarkerRef.current.getPosition();
        if (pos) {
          carLat = pos.lat;
          carLng = pos.lng;
        }
      }
    }

    if (!carLat || !carLng) {
      if (activeProtectors && activeProtectors.length > 0) {
        const p = activeProtectors[0];
        carLat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
        carLng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      }
    }

    const startTracking = (lat: number, lng: number) => {
      if (lastUserPosRef.current[0] !== 0) {
        const dy = lat - lastUserPosRef.current[0];
        const dx = lng - lastUserPosRef.current[1];
        if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
          headingRef.current = Math.atan2(dx, dy) * 180 / Math.PI;
        }
      }
      lastUserPosRef.current = [lat, lng];

      if (mapRef.current && typeof mapRef.current.easeTo === 'function') {
        mapRef.current.easeTo({
          center: [lng, lat],
          zoom: 19.5,
          pitch: 0,
          bearing: headingRef.current || 0,
          duration: 1000,
          easing: (t: number) => t
        });
      }
    };

    if (carLat && carLng) {
      startTracking(carLat, carLng);
    } else {
      const isDefaultPos = userPos && Math.abs(userPos.lat - 20.5937) < 0.001 && Math.abs(userPos.lng - 78.9629) < 0.001;
      if (userPos && userPos.lat !== undefined && !isDefaultPos) {
        startTracking(userPos.lat, userPos.lng);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { if (isCockpitMode) startTracking(pos.coords.latitude, pos.coords.longitude); },
          () => { },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
  }, [selectedAlertId, activeAlerts, activeProtectors, userPos, isCockpitMode, isLoaded]);

  useEffect(() => {
    if (mapRef.current && isCockpitMode) {
      const handleMove = (e: any) => {
        if (e.originalEvent) setIsCockpitMode(false);
      };
      mapRef.current.on('dragstart', handleMove);
      return () => {
        if (mapRef.current) mapRef.current.off('dragstart', handleMove);
      };
    }
  }, [isCockpitMode]);

  const handleFocusBase = () => {
    setIsCockpitMode(true);

    let carLat: number | null = null;
    let carLng: number | null = null;

    if (selectedAlertId) {
      const alert = activeAlerts.find(a => a.id === selectedAlertId);
      if (alert?.activeResponders?.length > 0) {
        carLat = alert.activeResponders[0].lastLocation?.lat || alert.activeResponders[0].lat || alert.activeResponders[0].latitude;
        carLng = alert.activeResponders[0].lastLocation?.lng || alert.activeResponders[0].lng || alert.activeResponders[0].longitude;
      }
    }

    if (!carLat || !carLng) {
      if (commandCenterMarkerRef.current && typeof commandCenterMarkerRef.current.getPosition === 'function') {
        const pos = commandCenterMarkerRef.current.getPosition();
        if (pos) {
          carLat = pos.lat;
          carLng = pos.lng;
        }
      }
    }

    if (!carLat || !carLng) {
      if (activeProtectors && activeProtectors.length > 0) {
        const p = activeProtectors[0];
        carLat = p.latitude || p.lat || p.lastLat || p.currentLat || p.lastLocation?.latitude || p.lastLocation?.lat || p.location?.latitude || p.location?.lat;
        carLng = p.longitude || p.lng || p.lastLng || p.currentLng || p.long || p.lastLocation?.longitude || p.lastLocation?.lng || p.location?.longitude || p.location?.lng;
      }
    }

    const flyToTarget = (lat: number, lng: number) => {
      if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 19, duration: 1500, pitch: 0, bearing: headingRef.current || 0 });
      }
    };

    if (carLat && carLng) {
      flyToTarget(carLat, carLng);
    } else {
      const isDefaultPos = userPos && Math.abs(userPos.lat - 20.5937) < 0.001 && Math.abs(userPos.lng - 78.9629) < 0.001;
      if (userPos && userPos.lat !== undefined && !isDefaultPos) {
        flyToTarget(userPos.lat, userPos.lng);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => flyToTarget(pos.coords.latitude, pos.coords.longitude),
          () => { },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
  };

  const handleFocusTarget = () => {
    if (!mapRef.current || !selectedAlertId) return;
    setIsCockpitMode(false);
    const alert = activeAlerts.find(a => a.id === selectedAlertId);
    if (!alert) return;
    const lat = alert.latitude || alert.lat || alert.location?.latitude || alert.location?.lat;
    const lng = alert.longitude || alert.lng || alert.location?.longitude || alert.location?.lng;
    const eloc = alert.mapplsId || alert.mappls_id;

    if (typeof mapRef.current.flyTo === 'function') {
      if (lat && lng) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 20, duration: 1500, pitch: 0, bearing: 45 });
      } else if (eloc) {
        mapRef.current.flyTo({ center: eloc, zoom: 20, duration: 1500, pitch: 0, bearing: 45 });
      }
    }
  };

  return { isCockpitMode, setIsCockpitMode, handleFocusBase, handleFocusTarget };
}
