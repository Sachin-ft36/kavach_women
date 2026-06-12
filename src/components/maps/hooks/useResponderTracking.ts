import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useKavachStore } from '../../../store/useKavachStore';

export function useResponderTracking(
  map: React.MutableRefObject<mapboxgl.Map | null>,
  markersRef: React.MutableRefObject<any>,
  isMapLoaded: boolean
) {
  useEffect(() => {
    const m = map.current;
    if (!m || !isMapLoaded) return;

    if (!markersRef.current.responders) {
      markersRef.current.responders = {};
    }
    const respMarkers = markersRef.current.responders;

    const q = query(
      collection(db, 'users'),
      where('isOnDuty', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      const activeIds = new Set<string>();

      snap.docs.forEach(doc => {
        const data = doc.data();
        const uid = doc.id;

        if (uid === useKavachStore.getState().user?.uid) return;

        const isPCR = data.role === 'pcr_officer';
        const isProtector = data.role === 'protector';
        if (!isPCR && !isProtector) return;

        const lat = data.lastLocation?.lat || data.latitude || data.location?.latitude || (data.coords && data.coords[0]);
        const lng = data.lastLocation?.lng || data.longitude || data.location?.longitude || (data.coords && data.coords[1]);
        if (!lat || !lng) return;

        activeIds.add(uid);

        if (!respMarkers[uid]) {
          const el = document.createElement('div');
          el.className = isPCR ? 'pcr-tracker-marker animate-pulse' : 'protector-tracker-marker animate-pulse';
          el.innerHTML = isPCR
            ? `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; pointer-events: auto;">
                 <div style="width: 26px; height: 26px; background: #0284c7; border: 2.5px solid white; border-radius: 50%; display: flex; items-center; justify-content: center; font-size: 13px; box-shadow: 0 0 15px rgba(2, 132, 199, 0.7); line-height: 22px; text-align: center;">🚔</div>
                 <div style="background: rgba(2,6,23,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 1.5px 5px; font-family: monospace; font-size: 6px; font-weight: 900; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">${data.vehicleNo || 'PCR-UNIT'}</div>
               </div>`
            : `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; pointer-events: auto;">
                 <div style="width: 26px; height: 26px; background: #059669; border: 2.5px solid white; border-radius: 50%; display: flex; items-center; justify-content: center; font-size: 13px; box-shadow: 0 0 15px rgba(5, 150, 105, 0.7); line-height: 22px; text-align: center;">🛡️</div>
                 <div style="background: rgba(2,6,23,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 1.5px 5px; font-family: sans-serif; font-size: 6px; font-weight: 900; color: #34d399; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">${(data.name || 'Protector').split(' ')[0]}</div>
               </div>`;

          respMarkers[uid] = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(m);
        } else {
          respMarkers[uid].setLngLat([lng, lat]);
        }
      });

      Object.keys(respMarkers).forEach(uid => {
        if (!activeIds.has(uid)) {
          respMarkers[uid].remove();
          delete respMarkers[uid];
        }
      });
    }, (error) => {
      console.warn("🛰️ KAVACH MAP: Responder tracking restricted by permissions.", error);
    });

    return () => {
      unsub();
      Object.keys(respMarkers).forEach(uid => {
        respMarkers[uid].remove();
        delete respMarkers[uid];
      });
    };
  }, [map, markersRef, isMapLoaded]);
}
