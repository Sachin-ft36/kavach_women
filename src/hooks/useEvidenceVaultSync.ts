import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { supabase } from '../lib/supabase';
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

    let liveAlertsList: any[] = [];
    let archiveAlertsList: any[] = [];
    let evidenceList: any[] = [];

    const mapRowToIncident = (row: any): any => {
      return {
        ...row.metadata,
        id: row.id,
        source: 'alert',
        victimUid: row.victim_uid,
        victimName: row.victim_name,
        status: row.status,
        timestamp: row.timestamp ? { toMillis: () => new Date(row.timestamp).getTime(), toDate: () => new Date(row.timestamp) } : undefined,
        location: row.metadata?.location || { latitude: 0, longitude: 0 }
      };
    };

    const mapRowToEvidence = (row: any): any => {
      return {
        ...row.metadata,
        id: row.id,
        source: 'evidence',
        alertId: row.alert_id,
        type: row.type,
        url: row.url,
        hash: row.hash,
        digitalSignature: row.digital_signature,
        timestamp: row.timestamp ? { toMillis: () => new Date(row.timestamp).getTime(), toDate: () => new Date(row.timestamp) } : undefined
      };
    };

    const updateAll = () => {
      const mergedAlerts = [...liveAlertsList, ...archiveAlertsList].sort((a: any, b: any) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      }).slice(0, 50);

      const combined = [...mergedAlerts, ...evidenceList].sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      });

      const formatted = combined.map(item => ({
        id: item.id,
        type: item.source === 'alert' ? 'SOS Activation' : item.type,
        date: item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Recent',
        status: item.source === 'alert' ? (item.status === 'active' ? 'Recording...' : 'Logged') : 'Verified',
        hash: item.hash || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        digitalSignature: item.digitalSignature || null,
        url: item.url || null,
        triggerMethod: item.triggerMethod || null
      }));
      
      setLogs(formatted);
      setLoading(false);
    };

    const loadInitialData = async () => {
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('victim_uid', uidToQuery)
        .order('timestamp', { ascending: false })
        .limit(20);

      const { data: archives } = await supabase
        .from('incident_archive')
        .select('*')
        .eq('victim_uid', uidToQuery)
        .order('timestamp', { ascending: false })
        .limit(50);

      liveAlertsList = (alerts || []).map(mapRowToIncident);
      archiveAlertsList = (archives || []).map(mapRowToIncident);

      const alertIds = [...liveAlertsList, ...archiveAlertsList].map(a => a.id);

      if (alertIds.length > 0) {
        const { data: evs } = await supabase
          .from('evidence')
          .select('*')
          .in('alert_id', alertIds);
        evidenceList = (evs || []).map(mapRowToEvidence);
      }

      updateAll();
    };

    loadInitialData();

    // Setup active listeners
    const alertsCh = supabase
      .channel('vault:alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `victim_uid=eq.${uidToQuery}` }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const mapped = mapRowToIncident(payload.new);
          liveAlertsList = [mapped, ...liveAlertsList.filter(a => a.id !== mapped.id)];
        } else if (payload.eventType === 'DELETE') {
          liveAlertsList = liveAlertsList.filter(a => a.id !== payload.old.id);
        }
        updateAll();
      })
      .subscribe();

    const archiveCh = supabase
      .channel('vault:archive')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_archive', filter: `victim_uid=eq.${uidToQuery}` }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const mapped = mapRowToIncident(payload.new);
          archiveAlertsList = [mapped, ...archiveAlertsList.filter(a => a.id !== mapped.id)].slice(0, 50);
        } else if (payload.eventType === 'DELETE') {
          archiveAlertsList = archiveAlertsList.filter(a => a.id !== payload.old.id);
        }
        updateAll();
      })
      .subscribe();

    const evidenceCh = supabase
      .channel('vault:evidence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evidence' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const mapped = mapRowToEvidence(payload.new);
          const alertIds = [...liveAlertsList, ...archiveAlertsList].map(a => a.id);
          if (alertIds.includes(mapped.alertId)) {
            evidenceList = [mapped, ...evidenceList.filter(e => e.id !== mapped.id)];
          }
        } else if (payload.eventType === 'DELETE') {
          evidenceList = evidenceList.filter(e => e.id !== payload.old.id);
        }
        updateAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsCh);
      supabase.removeChannel(archiveCh);
      supabase.removeChannel(evidenceCh);
    };
  }, [targetUid]);

  return { logs, firs, loading };
}
