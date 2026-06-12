import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { fetchNearbyPoliceMappls } from '../../../services/MapplsService';

export function useSafeHavenData(userPos: { lat: number; lng: number } | null) {
  const [policeStations, setPoliceStations] = useState<any[]>([]);
  const [protectors, setProtectors] = useState<any[]>([]);

  useEffect(() => {
    if (!userPos) return;

    fetchNearbyPoliceMappls(userPos.lat, userPos.lng).then(stations => {
      if(stations) setPoliceStations(stations.slice(0, 15));
    });

    const q = query(collection(db, 'users'), where('role', '==', 'protector'), where('isVerified', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFound = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setProtectors(allFound.filter(p => p.coords));
    });

    return () => unsubscribe();
  }, [userPos]);

  return { policeStations, protectors };
}
