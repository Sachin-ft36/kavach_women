import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

export function useHomeBaseLocation(
  data: any,
  setData: (data: any) => void,
  isPcrRoute: boolean
) {
  const [isLocating, setIsLocating] = useState(false);

  const handleFetchLocation = async () => {
    const confirmHome = window.confirm(
      isPcrRoute 
        ? "SECURITY ALERT: This will fetch your CURRENT coordinates. Please ensure you are at your ASSIGNED POLICE STATION or HOME BASE."
        : "SECURITY ALERT: This will fetch your CURRENT location. Please ensure you are at your PERMANENT RESIDENCE / HOME BASE before proceeding."
    );
    
    if (!confirmHome) return;

    setIsLocating(true);
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const { latitude, longitude } = position.coords;

      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address`);
      const json = await res.json();
      
      if (json.features && json.features.length > 0) {
        setData({ ...data, address: json.features[0].place_name });
        toast.success(isPcrRoute ? "Precinct Coordinates Synchronized" : "Home Base Synchronized");
      }
    } catch (e) {
      toast.error("Geolocation Failed. Please enter manually.");
    } finally {
      setIsLocating(false);
    }
  };

  return { isLocating, handleFetchLocation };
}
