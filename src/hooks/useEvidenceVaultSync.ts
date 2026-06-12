import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, where, limit } from 'firebase/firestore';

export function useEvidenceVaultSync(targetUid?: string) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firs, setFirs] = useState<any[]>([]);
  const [rawLogs, setRawLogs] = useState<{ alerts: any[], evidence: any[] }>({ alerts: [], evidence: [] });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const qFirs = query(collection(db, 'zero_firs'), where('victimUid', '==', currentUser.uid));
    const unsubFirs = onSnapshot(qFirs, (snapshot) => {
      const firData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      });
      setFirs(firData);
    });
    return () => unsubFirs();
  }, []);

  const updateLogs = (data: any[], type: 'alerts' | 'evidence') => {
    setRawLogs(prev => {
      const next = { ...prev, [type]: data };
      const combined = [...next.alerts, ...next.evidence].sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      });
      const formatted = combined.map(item => ({
        id: item.id,
        type: item.source === 'alert' ? 'SOS Activation' : item.type,
        date: item.timestamp?.toDate().toLocaleString() || 'Recent',
        status: item.source === 'alert' ? (item.status === 'active' ? 'Recording...' : 'Logged') : 'Verified',
        hash: item.hash || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        digitalSignature: item.digitalSignature || null,
        url: item.url || null,
        triggerMethod: item.triggerMethod || null
      }));
      setLogs(formatted);
      setLoading(false);
      return next;
    });
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const uidToQuery = targetUid || auth.currentUser.uid;
    
    const qAlerts = query(
      collection(db, 'alerts'),
      where('victimUid', '==', uidToQuery),
      limit(20)
    );

    const activeEvidenceUnsubs: (() => void)[] = [];

    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      const alertList = snapshot.docs.map(doc => ({ id: doc.id, source: 'alert' as const, ...doc.data() }));
      const sortedAlerts = alertList.sort((a: any, b: any) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      }).slice(0, 10);
      
      updateLogs(sortedAlerts, 'alerts');

      activeEvidenceUnsubs.forEach(unsub => unsub());
      activeEvidenceUnsubs.length = 0;

      sortedAlerts.forEach(alert => {
        const unsubEv = onSnapshot(collection(db, 'alerts', alert.id, 'evidence'), (evSnap) => {
          const evList = evSnap.docs.map(d => ({ id: d.id, source: 'evidence' as const, ...d.data() }));
          setRawLogs(prev => {
            const otherEv = prev.evidence.filter(e => !evList.find(ne => ne.id === e.id));
            const newEv = [...otherEv, ...evList];
            
            const combined = [...prev.alerts, ...newEv].sort((a, b) => {
              const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
              const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
              return tB - tA;
            });

            const formatted = combined.map(item => ({
              id: item.id,
              type: item.source === 'alert' ? 'SOS Activation' : item.type,
              date: item.timestamp?.toDate().toLocaleString() || 'Recent',
              status: item.source === 'alert' ? (item.status === 'active' ? 'Recording...' : 'Logged') : 'Verified',
              hash: item.hash || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              digitalSignature: item.digitalSignature || null,
              url: item.url || null,
              triggerMethod: item.triggerMethod || null
            }));
            setLogs(formatted);
            setLoading(false);
            return { ...prev, evidence: newEv };
          });
        });
        activeEvidenceUnsubs.push(unsubEv);
      });
    }, (err) => {
      console.warn("Vault Alerts Sync Info:", err.message);
    });

    return () => { 
      unsubAlerts(); 
      activeEvidenceUnsubs.forEach(unsub => unsub());
    };
  }, [targetUid]);

  return { logs, firs, loading };
}
