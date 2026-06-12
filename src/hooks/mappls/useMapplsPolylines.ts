import { useEffect, MutableRefObject } from 'react';

export function useMapplsPolylines(
  mapRef: MutableRefObject<any>,
  isLoaded: boolean,
  victimPath: any[] | undefined,
  protectorPath: any[] | undefined,
  polylineRef: MutableRefObject<any[]>
) {
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const Mappls = (window as any).mappls;

    if (polylineRef.current) {
      polylineRef.current.forEach((line: any) => {
        try {
          if (typeof line.remove === 'function') {
            line.remove();
          } else if (typeof line.setMap === 'function') {
            line.setMap(null);
          } else if (Mappls && typeof Mappls.remove === 'function') {
            Mappls.remove({ map: mapRef.current, layer: line });
          }
        } catch (e) {
          console.warn("Failed to remove polyline", e);
        }
      });
      polylineRef.current = [];
    } else {
      polylineRef.current = [];
    }

    if (victimPath && victimPath.length > 0) {
      const vpathCoords = victimPath.map((p: any) => ({ lat: p.lat || p.latitude, lng: p.lng || p.longitude }));
      const vLine = new Mappls.Polyline({
        map: mapRef.current,
        path: vpathCoords,
        strokeColor: '#EF4444',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        lineDasharray: [2, 4]
      });
      polylineRef.current.push(vLine);
    }

    if (protectorPath && protectorPath.length > 0) {
      const ppathCoords = protectorPath.map((p: any) => ({ lat: p.lat || p.latitude, lng: p.lng || p.longitude }));
      const pLine = new Mappls.Polyline({
        map: mapRef.current,
        path: ppathCoords,
        strokeColor: '#06B6D4',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        lineDasharray: [2, 4]
      });
      polylineRef.current.push(pLine);
    }

  }, [isLoaded, victimPath, protectorPath]);
}
