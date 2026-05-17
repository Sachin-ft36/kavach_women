import { useState, useEffect } from 'react';
import { useKavachStore } from '../store/useKavachStore';

export interface PoliceStation {
  id: string;
  name: string;
  address: string;
  distance: string;
  coords: [number, number];
  phone?: string;
}

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

export const useNearbyPolice = () => {
  const { userPos } = useKavachStore();
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userPos) return;

    const fetchPoliceStations = async () => {
      setLoading(true);
      try {
        const [lat, lng] = userPos;
        // 🛰️ TACTICAL SEARCH: Finding 'police' nodes within the vicinity
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/police.json?proximity=${lng},${lat}&access_token=${MAPBOX_TOKEN}&limit=5&types=poi&bbox=${lng-0.1},${lat-0.1},${lng+0.1},${lat+0.1}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.features) {
          const mapped: PoliceStation[] = data.features.map((f: any) => ({
            id: f.id,
            name: f.text,
            address: f.properties?.address || f.place_name,
            coords: f.geometry.coordinates,
            distance: 'Detecting...' // Will calculate properly in UI
          }));
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
