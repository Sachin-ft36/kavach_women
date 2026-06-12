import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { IncidentRecord, UserProfile, ZeroFIRRecord, JourneyRecord } from '../domain/types';

export function useSuperCellData() {
  const [activeAlerts, setActiveAlerts] = useState<IncidentRecord[]>([]);
  const [missionHistory, setMissionHistory] = useState<IncidentRecord[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<JourneyRecord[]>([]);
  const [verifiedProtectors, setVerifiedProtectors] = useState<UserProfile[]>([]);
  const [pendingProtectors, setPendingProtectors] = useState<UserProfile[]>([]);
  const [activeFirs, setActiveFirs] = useState<ZeroFIRRecord[]>([]);
  const [userStatusMap, setUserStatusMap] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const syncCollection = (collName: string) => {
      return onSnapshot(collection(db, collName), (snapshot) => {
        setUserStatusMap(prev => {
          const newMap = { ...prev };
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() } as UserProfile;
            newMap[doc.id] = data;
          });
          return newMap;
        });

        if (collName === 'users' || collName === 'male_users' || collName === 'women_users') {
          const vProts: UserProfile[] = [];
          const pProts: UserProfile[] = [];
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...(doc.data() as UserProfile), originCollection: collName };
            if (data.role?.toLowerCase() === 'protector') {
              if (data.isVerified || data.verified) vProts.push(data);
              else pProts.push(data);
            }
          });

          setVerifiedProtectors(prev => {
            const combined = [...prev.filter(p => p.originCollection !== collName), ...vProts];
            return Array.from(new Map(combined.map(p => [p.id, p])).values());
          });
          setPendingProtectors(prev => {
            const combined = [...prev.filter(p => p.originCollection !== collName), ...pProts];
            return Array.from(new Map(combined.map(p => [p.id, p])).values());
          });
        }
      });
    };

    const unsubUsers = syncCollection('users');
    const unsubWomen = syncCollection('women_users');
    const unsubMales = syncCollection('male_users');

    const unsubscribeAlerts = onSnapshot(
      query(collection(db, 'alerts'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncidentRecord));
        setActiveAlerts(alerts.filter(a => a.status && ['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
        setMissionHistory(alerts.filter(a => a.status && !['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
      }
    );

    const unsubscribeFirs = onSnapshot(
      query(collection(db, 'zero_firs'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        setActiveFirs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ZeroFIRRecord)));
      }
    );

    const unsubJourneys = onSnapshot(
      query(collection(db, 'journeys'), where('status', 'in', ['active', 'emergency'])),
      (snapshot) => {
        setActiveJourneys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JourneyRecord)));
      }
    );

    return () => {
      unsubUsers();
      unsubWomen();
      unsubMales();
      unsubscribeAlerts();
      unsubscribeFirs();
      unsubJourneys();
    };
  }, []);

  return {
    activeAlerts,
    missionHistory,
    activeJourneys,
    verifiedProtectors,
    pendingProtectors,
    activeFirs,
    userStatusMap
  };
}
