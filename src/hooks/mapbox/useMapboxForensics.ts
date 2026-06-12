import { useEffect, MutableRefObject } from 'react';

export function useMapboxForensics(
  mapRef: MutableRefObject<any>,
  isMapLoaded: boolean,
  victimPath: any[] | undefined,
  protectorPath: any[] | undefined,
  safePath: any[] | undefined,
  projectedPath: any[] | undefined,
  replayProgress: number
) {
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !mapRef.current.getSource('forensic-source')) return;

    const slicePath = (path: any[], progress: number) => {
      if (!path || path.length === 0) return [];
      const count = Math.ceil(path.length * progress);
      return path.slice(0, count).map(p => Array.isArray(p) ? p : [p.lng, p.lat]);
    };

    const features = [];
    if (safePath && safePath.length > 1) {
      features.push({ type: 'Feature', properties: { type: 'safe' }, geometry: { type: 'LineString', coordinates: safePath.map(p => Array.isArray(p) ? p : [p.lng, p.lat]) } });
    }
    if (victimPath && victimPath.length > 1) {
      features.push({ type: 'Feature', properties: { type: 'victim' }, geometry: { type: 'LineString', coordinates: slicePath(victimPath, replayProgress) } });
    }
    if (projectedPath && projectedPath.length > 1) {
      features.push({ type: 'Feature', properties: { type: 'projected' }, geometry: { type: 'LineString', coordinates: projectedPath.map(p => Array.isArray(p) ? p : [p.lng, p.lat]) } });
    }
    if (protectorPath && protectorPath.length > 1) {
      features.push({ type: 'Feature', properties: { type: 'protector' }, geometry: { type: 'LineString', coordinates: protectorPath.map(p => Array.isArray(p) ? p : [p.lng, p.lat]) } });
    }

    mapRef.current.getSource('forensic-source').setData({ type: 'FeatureCollection', features });
  }, [victimPath, protectorPath, safePath, projectedPath, replayProgress, isMapLoaded]);
}
