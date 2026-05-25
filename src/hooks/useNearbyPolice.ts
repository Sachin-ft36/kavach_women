import { useState, useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';

export interface PoliceStation {
  id: string;
  name: string;
  address: string;
  distanceInMeters: number;
  distanceDisplay: string;
  coords: [number, number]; // [longitude, latitude] matching Mapbox GeoJSON specifications
  phone?: string;
}

// 🛡️ SECURE PLUG: Pulling credentials out of uncompiled client source code arrays
// Fallback to the existing token to ensure it doesn't break if .env is not set up yet
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

/**
 * High-precision Haversine formula implementation.
 * Computes exact great-circle spatial distances between coordinate pairs.
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's mean radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Absolute distance return value expressed in meters
}

export const useNearbyPolice = () => {
  const { userPos } = useKavachStore();
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(false);
  
  const lastProcessedLocationRef = useRef<string>("");

  useEffect(() => {
    if (!userPos || !userPos[0] || !userPos[1]) return;
    if (!MAPBOX_TOKEN) {
      console.error("❌ MAPBOX GATEWAY: Missing API credential token configuration.");
      return;
    }

    const [lat, lng] = userPos;
    const locationKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    
    // Throttling: Skip API requests if the user has moved less than ~11 meters
    if (lastProcessedLocationRef.current === locationKey) return;
    lastProcessedLocationRef.current = locationKey;

    const fetchPoliceStations = async () => {
      setLoading(true);
      try {
        // Dynamic bounding box adjustment based on latitude to maintain consistent search areas
        const latDegreeInMeters = 111000;
        const lonDegreeInMeters = 111000 * Math.cos((lat * Math.PI) / 180);
        
        const searchRadiusMeters = 15000; // 15 Kilometers search boundary limit
        const deltaLat = searchRadiusMeters / latDegreeInMeters;
        const deltaLng = searchRadiusMeters / lonDegreeInMeters;

        const bbox = `${lng - deltaLng},${lat - deltaLat},${lng + deltaLng},${lat + deltaLat}`;
        
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/police.json?proximity=${lng},${lat}&access_token=${MAPBOX_TOKEN}&limit=5&types=poi&bbox=${bbox}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP network response failure: ${response.status}`);
        
        const data = await response.json();

        if (data && Array.isArray(data.features)) {
          const mapped: PoliceStation[] = data.features.map((f: any) => {
            const stationLng = f.geometry.coordinates[0];
            const stationLat = f.geometry.coordinates[1];
            
            // Calculate distance immediately during array conversion
            const distanceInMeters = calculateHaversineDistance(lat, lng, stationLat, stationLng);
            
            // Format distance into a clean reader display string
            const distanceDisplay = distanceInMeters > 1000 
              ? `${(distanceInMeters / 1000).toFixed(1)} km`
              : `${Math.round(distanceInMeters)} m`;

            return {
              id: f.id,
              name: f.text,
              address: f.properties?.address || f.place_name,
              coords: [stationLng, stationLat],
              distanceInMeters,
              distanceDisplay,
              phone: f.properties?.tel || undefined
            };
          });

          // Sort arrays systematically to ensure the absolute closest option is always item 0
          mapped.sort((a, b) => a.distanceInMeters - b.distanceInMeters);
          setPoliceStations(mapped);
        }
      } catch (error) {
        console.error("Police Grid Search Failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoliceStations();
  }, [userPos]);

  return { policeStations, loading };
};
