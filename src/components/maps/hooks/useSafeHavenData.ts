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
      const now = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;
      const allFound = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setProtectors(allFound.filter(p => {
        if (!p.coords) return false;
        if (p.status === 'offline') return false;
        if (!p.lastActive) return false;
        const lastActiveMs = p.lastActive.toMillis ? p.lastActive.toMillis() : new Date(p.lastActive).getTime();
        return (now - lastActiveMs) < fiveMinutesMs;
      }));
    });

    return () => unsubscribe();
  }, [userPos]);

  return { policeStations, protectors };
}
