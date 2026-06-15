import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { supabase } from '../lib/supabase';
import { IncidentRecord, UserProfile, ZeroFIRRecord, JourneyRecord } from '../domain/types';
import { toast } from 'sonner';

export function useSuperCellData() {
  const [activeAlerts, setActiveAlerts] = useState<IncidentRecord[]>([]);
  const [missionHistory, setMissionHistory] = useState<IncidentRecord[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<JourneyRecord[]>([]);
  const [verifiedProtectors, setVerifiedProtectors] = useState<UserProfile[]>([]);
  const [pendingProtectors, setPendingProtectors] = useState<UserProfile[]>([]);
  const [activeFirs, setActiveFirs] = useState<ZeroFIRRecord[]>([]);
  const [userStatusMap, setUserStatusMap] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const syncSupabaseProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) {
          console.error("🚨 Supabase profile load error:", error);
          toast.error(`Supabase sync failed: ${error.message}`);
          return;
        }

        const mappedUsers: Record<string, UserProfile> = {};
        const vProts: UserProfile[] = [];
        const pProts: UserProfile[] = [];

        (data || []).forEach(p => {
          const meta = p.metadata || {};
          
          let lat: number | undefined = undefined;
          let lng: number | undefined = undefined;
          
          if (p.last_location && typeof p.last_location === 'string') {
            const match = p.last_location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
            if (match) {
              lng = parseFloat(match[1]);
              lat = parseFloat(match[2]);
            }
          }

          const mapped: UserProfile = {
            id: p.id,
            uid: p.id,
            name: meta.name || meta.username || p.display_name || 'Kavach Citizen',
            email: p.email,
            role: (p.role || 'citizen') as any,
            gender: p.gender || meta.gender || 'female',
            isVerified: !!p.is_verified,
            isRegistered: meta.isRegistered !== false,
            xp: p.xp || 0,
            phoneNumber: meta.phoneNumber || meta.phone || 'DATA_NOT_SYNCED',
            phone: meta.phone || meta.phoneNumber || 'DATA_NOT_SYNCED',
            lastLocation: (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined,
            state: meta.state || 'ALL',
            city: meta.city || 'Sector Unknown',
            address: meta.address || 'Sector Unknown',
            fullAddress: meta.fullAddress || meta.address || 'Sector Unknown',
            isOnDuty: !!meta.isOnDuty,
            vehicleNo: meta.vehicleNo || undefined,
            badgeId: meta.badgeId || undefined,
            rank: meta.rank || undefined,
            thanaName: meta.thanaName || undefined,
            rating: meta.rating || 5.0,
            ratingCount: meta.ratingCount || 1,
            level: meta.level || '1',
            livesHelped: meta.livesHelped || 0,
            successRate: meta.successRate || 100,
            avgResponse: meta.avgResponse || 'N/A',
            protectorVetting: meta.protectorVetting || undefined,
            photoUrl: meta.photoUrl || meta.photoURL || undefined,
            photoURL: meta.photoURL || meta.photoUrl || undefined
          };

          mappedUsers[p.id] = mapped;

          if (mapped.role?.toLowerCase() === 'protector') {
            if (mapped.isVerified) vProts.push(mapped);
            else pProts.push(mapped);
          }
        });

        setUserStatusMap(mappedUsers);
        setVerifiedProtectors(vProts);
        setPendingProtectors(pProts);
      } catch (err: any) {
        console.error("🚨 Supabase profiles query error:", err);
      }
    };

    syncSupabaseProfiles();

    const profilesChannel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        syncSupabaseProfiles();
      })
      .subscribe();

    let liveAlertsList: IncidentRecord[] = [];
    let archiveAlertsList: IncidentRecord[] = [];

    const mapRowToIncident = (row: any): IncidentRecord => {
      const metadata = row.metadata || {};
      return {
        ...metadata,
        id: row.id,
        victimUid: row.victim_uid,
        victimName: row.victim_name,
        status: row.status,
        timestamp: row.timestamp ? { toMillis: () => new Date(row.timestamp).getTime(), toDate: () => new Date(row.timestamp) } : undefined,
        location: metadata.location || { latitude: 0, longitude: 0 },
        responders: metadata.responders || row.responders || {}
      } as IncidentRecord;
    };

    const updateAlerts = () => {
       const all = [...liveAlertsList, ...archiveAlertsList];
       const uniqueMap = new Map<string, IncidentRecord>();
       all.forEach(a => uniqueMap.set(a.id, a));
       const uniqueAll = Array.from(uniqueMap.values()).sort((a, b) => {
          const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return tB - tA;
       });

       setActiveAlerts(uniqueAll.filter(a => a.status && ['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
       setMissionHistory(uniqueAll.filter(a => a.status && !['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
    };

    const loadInitialAlerts = async () => {
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false });

      const { data: archives } = await supabase
        .from('incident_archive')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      liveAlertsList = (alerts || []).map(mapRowToIncident);
      archiveAlertsList = (archives || []).map(mapRowToIncident);
      updateAlerts();
    };

    loadInitialAlerts();

    const alertsChannel = supabase
      .channel('public:alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const mapped = mapRowToIncident(payload.new);
          liveAlertsList = [mapped, ...liveAlertsList.filter(a => a.id !== mapped.id)];
        } else if (payload.eventType === 'DELETE') {
          liveAlertsList = liveAlertsList.filter(a => a.id !== payload.old.id);
        }
        updateAlerts();
      })
      .subscribe();

    const archiveChannel = supabase
      .channel('public:incident_archive')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_archive' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const mapped = mapRowToIncident(payload.new);
          archiveAlertsList = [mapped, ...archiveAlertsList.filter(a => a.id !== mapped.id)].slice(0, 100);
        } else if (payload.eventType === 'DELETE') {
          archiveAlertsList = archiveAlertsList.filter(a => a.id !== payload.old.id);
        }
        updateAlerts();
      })
      .subscribe();

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
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(archiveChannel);
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
