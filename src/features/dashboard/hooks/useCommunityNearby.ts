import { useState, useEffect, useRef } from 'react';

export interface NearbyPlace {
  name: string;
  distanceKm: number;
  count: number;
}

export interface CommunityNearbyData {
  police: NearbyPlace;
  hospital: NearbyPlace;
  safeZone: NearbyPlace;
  isLoading: boolean;
  hasLocation: boolean;
  lastUpdated: number | null;
}

const CACHE_KEY = 'kavach_community_nearby_v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min cache — free API, don't spam

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}`;
}

// Overpass API query — gets nodes within radius for a given OSM tag
async function queryOverpass(lat: number, lon: number, radiusM: number, filter: string): Promise<any[]> {
  const query = `
    [out:json][timeout:10];
    (
      node${filter}(around:${radiusM},${lat},${lon});
      way${filter}(around:${radiusM},${lat},${lon});
    );
    out center;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Overpass failed');
  const json = await resp.json();
  return json.elements || [];
}

function getNearestDist(elements: any[], userLat: number, userLon: number): { distKm: number; count: number } {
  if (!elements.length) return { distKm: -1, count: 0 };
  const withDist = elements.map(el => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) return null;
    return { distKm: getDistanceKm(userLat, userLon, lat, lon) };
  }).filter(Boolean) as { distKm: number }[];
  if (!withDist.length) return { distKm: -1, count: 0 };
  withDist.sort((a, b) => a.distKm - b.distKm);
  return { distKm: withDist[0].distKm, count: withDist.length };
}

const DEFAULT_DATA: CommunityNearbyData = {
  police:   { name: 'Police Booth',  distanceKm: -1, count: 0 },
  hospital: { name: 'Hospital',      distanceKm: -1, count: 0 },
  safeZone: { name: 'Safe Zone',     distanceKm: -1, count: 0 },
  isLoading: true,
  hasLocation: false,
  lastUpdated: null,
};

export function useCommunityNearby(userLat?: number | null, userLon?: number | null): CommunityNearbyData {
  const [data, setData] = useState<CommunityNearbyData>(() => {
    // Load from cache instantly
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.lastUpdated < CACHE_TTL_MS) {
          return { ...parsed, isLoading: false };
        }
      }
    } catch {}
    return DEFAULT_DATA;
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!userLat || !userLon) {
      // No location — get from browser geolocation
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        pos => fetchAll(pos.coords.latitude, pos.coords.longitude),
        () => setData(prev => ({ ...prev, isLoading: false, hasLocation: false })),
        { timeout: 8000, maximumAge: 300000 }
      );
      return;
    }
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchAll(userLat, userLon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLat, userLon]);

  async function fetchAll(lat: number, lon: number) {
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Same location within 500m and fresh cache
        const locDiff = getDistanceKm(lat, lon, parsed._lat || 0, parsed._lon || 0);
        if (locDiff < 0.5 && Date.now() - parsed.lastUpdated < CACHE_TTL_MS) {
          setData({ ...parsed, isLoading: false, hasLocation: true });
          return;
        }
      }
    } catch {}

    setData(prev => ({ ...prev, isLoading: true, hasLocation: true }));

    try {
      // Run all 3 queries in parallel — 3km radius
      const [policeEls, hospitalEls, safeZoneEls] = await Promise.all([
        queryOverpass(lat, lon, 3000, '["amenity"="police"]'),
        queryOverpass(lat, lon, 5000, '["amenity"="hospital"]'),
        queryOverpass(lat, lon, 5000, '["amenity"~"community_centre|shelter|fire_station"]'),
      ]);

      const police = getNearestDist(policeEls, lat, lon);
      const hospital = getNearestDist(hospitalEls, lat, lon);
      const safeZone = getNearestDist(safeZoneEls, lat, lon);

      const newData: CommunityNearbyData & { _lat: number; _lon: number } = {
        police:   { name: 'Police Booth',  distanceKm: police.distKm,   count: police.count   },
        hospital: { name: 'Hospital',      distanceKm: hospital.distKm, count: hospital.count  },
        safeZone: { name: 'Safe Zone',     distanceKm: safeZone.distKm, count: safeZone.count  },
        isLoading: false,
        hasLocation: true,
        lastUpdated: Date.now(),
        _lat: lat,
        _lon: lon,
      };

      setData(newData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
    } catch {
      setData(prev => ({ ...prev, isLoading: false, hasLocation: true }));
    }
  }

  return data;
}

// ─── Helper to format display ───────────────────────────────────────────────
export function formatNearbyDisplay(place: NearbyPlace): { count: string; unit: string; subtext: string } {
  if (place.distanceKm < 0) {
    return { count: '—', unit: '', subtext: 'Searching...' };
  }
  const dist = place.distanceKm;
  const countStr = dist < 1 ? `${Math.round(dist * 1000)}` : `${dist.toFixed(1)}`;
  const unit = dist < 1 ? 'm' : 'km';
  const countLabel = place.count > 0 ? `• ${place.count} ${place.name}${place.count > 1 ? 's' : ''} Nearby` : '• Searching...';
  return { count: countStr, unit, subtext: countLabel };
}
