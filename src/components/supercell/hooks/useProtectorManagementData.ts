import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export function useProtectorManagementData(selectedProtId: string | null) {
  const [missionStats, setMissionStats] = useState<Record<string, any>>({});
  const [missionHistory, setMissionHistory] = useState<any[]>([]);

  useEffect(() => {
    // 📡 FETCH MISSION SUCCESS DATA (Aggregated from alerts)
    const qMissions = query(collection(db, 'alerts'), where('status', '==', 'resolved'));
    const unsubMissions = onSnapshot(qMissions, (snap) => {
       const stats: Record<string, any> = {};
       snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.activeResponders && Array.isArray(data.activeResponders)) {
            data.activeResponders.forEach((res: any) => {
              const respId = res.uid;
              if (respId) {
                if (!stats[respId]) stats[respId] = { total: 0, successful: 0 };
                stats[respId].total += 1;
                stats[respId].successful += 1;
              }
            });
          }
       });
       setMissionStats(stats);
    });

    return () => unsubMissions();
  }, []);

  // 🗄️ FETCH PROTECTOR SERVICE LEGACY (Resolved Missions)
  useEffect(() => {
     if (!selectedProtId) {
       setMissionHistory([]);
       return;
     }
     // Query alerts where this protector was a responder
     const q = query(collection(db, 'alerts'), where('status', '==', 'resolved'), orderBy('timestamp', 'desc'));
     const unsubHistory = onSnapshot(q, (snap) => {
        const missions = snap.docs
           .map(d => ({ id: d.id, ...d.data() }))
           .filter((a: any) => a.activeResponders?.some((r: any) => r.uid === selectedProtId));
        setMissionHistory(missions);
     });
     return () => unsubHistory();
  }, [selectedProtId]);

  return { missionStats, missionHistory };
}
