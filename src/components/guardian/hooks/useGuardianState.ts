import { useState, useEffect, useRef } from 'react';
import { useKavachStore } from '../../../state/useKavachStore';
import { db } from '../../../firebase';
import { 
  collection, query, where, onSnapshot, getDocs, doc, 
  addDoc, serverTimestamp, getDoc, limit, orderBy, updateDoc, writeBatch
} from 'firebase/firestore';
import { toast } from 'sonner';

export function useGuardianState() {
  const { user, profile, userPos } = useKavachStore();
  const [activeTab, setActiveTab] = useState<'status' | 'logs'>('status');
  
  // Dynamic State variables for family nodes
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const displayMember = familyMembers[0] || null;
  const [loadingFamily, setLoadingFamily] = useState(true);
  const [activeSOSAlert, setActiveSOSAlert] = useState<any | null>(null);
  const [hudStats, setHudStats] = useState({ pingCount: 0, ringStatus: 'idle', sirenStatus: 'idle', checkInStatus: 'idle' });
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, any>>({});
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastResolvedMember, setLastResolvedMember] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [historicalJourneys, setHistoricalJourneys] = useState<any[]>([]);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "Family Safety Network activated successfully.",
    "Secure encrypted session established.",
    "Awaiting location updates..."
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // 1. Subscribe to linked citizen(s) by matching guardian phone number
  useEffect(() => {
    if (!profile?.phoneNumber) return;

    const guardianPhone = profile.phoneNumber;
    const guardianPhoneClean = `+91${guardianPhone.replace(/\D/g, '').slice(-10)}`;
    const familyPhone: string | null = (profile as any)?.protectorVetting?.familyPhone || null;

    addLog(`Scanning safety logs for linked family accounts...`);

    let familyByPrimary: any[] = [];
    let familyByDirect: any[] = [];

    const mergeAndSet = () => {
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const m of [...familyByPrimary, ...familyByDirect]) {
        const key = m.uid || m.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(m);
        }
      }
      setFamilyMembers(merged);
      setLoadingFamily(false);
      addLog(`Connected to ${merged.length} family member${merged.length !== 1 ? 's' : ''}.`);
    };

    // Query 1 — Citizens who added this guardian
    const q1 = query(
      collection(db, 'users'),
      where('primaryGuardian.phone', 'in', [guardianPhone, guardianPhoneClean])
    );
    const unsub1 = onSnapshot(q1, (snap) => {
      familyByPrimary = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      mergeAndSet();
    }, (err) => {
      console.error('Guardian Q1 error:', err);
      setLoadingFamily(false);
    });

    // Query 2 — Guardian explicitly linked phone
    let unsub2: (() => void) | null = null;
    if (familyPhone) {
      const familyPhoneClean = `+91${familyPhone.replace(/\D/g, '').slice(-10)}`;
      const q2 = query(
        collection(db, 'users'),
        where('phoneNumber', 'in', [familyPhone, familyPhoneClean])
      );
      unsub2 = onSnapshot(q2, (snap) => {
        familyByDirect = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet();
      }, (err) => {
        console.error('Guardian Q2 error:', err);
      });
    }

    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [profile?.phoneNumber, (profile as any)?.protectorVetting?.familyPhone]);

  // Real-time reverse geocoding watcher for family member movement
  useEffect(() => {
    if (familyMembers.length === 0) return;
    
    familyMembers.forEach(async (member) => {
      const id = member.id || member.uid;
      const lat = member.lastLocation?.lat || member.locationData?.lat || member.latitude;
      const lng = member.lastLocation?.lng || member.locationData?.lng || member.longitude;
      if (!id || !lat || !lng) return;

      const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (resolvedAddresses[id]?.cacheKey === cacheKey) return;

      try {
        const { getReverseMetadata } = await import('../../../services/locationService');
        const resolved = await getReverseMetadata(lat, lng);
        setResolvedAddresses(prev => ({
          ...prev,
          [id]: {
            ...resolved,
            cacheKey
          }
        }));
      } catch (err) {
        console.warn("Guardian reverse geocoding fail:", err);
      }
    });
  }, [familyMembers]);

  // 2. Subscribe to active alerts for the linked family members
  useEffect(() => {
    if (familyMembers.length === 0) return;
    const uids = familyMembers.map(m => m.uid || m.id).filter(Boolean);
    if (uids.length === 0) return;

    // Primary listener: query by victimUid (no compound index required) and filter in memory
    const qActive = query(
      collection(db, 'alerts'),
      where('victimUid', 'in', uids)
    );

    const unsubActive = onSnapshot(qActive, (snap) => {
      const activeDocs = snap.docs.filter(d => 
        ['active', 'responding', 'supercell_dispatched', 'rescued_pending_victim_clearance'].includes(d.data().status)
      );

      if (activeDocs.length > 0) {
        const activeAlert = activeDocs[0].data();
        setActiveSOSAlert(prev => {
          // Only update if it's a new alert or data changed
          if (!prev || prev.id !== activeDocs[0].id) {
            addLog(`Emergency alert active for ${activeAlert.victimName}!`);
          }
          return { id: activeDocs[0].id, ...activeAlert };
        });
      } else {
        // No active alerts found – clear guardian HUD
        setActiveSOSAlert(prev => {
          if (prev !== null) addLog(`SOS alert resolved. All clear.`);
          return null;
        });
      }
    }, (err) => {
      console.error('Guardian alert listener error:', err);
    });

    return () => unsubActive();
  }, [familyMembers]);

  // 2b. Belt-and-suspenders: watch the specific active alert document directly.
  useEffect(() => {
    if (!activeSOSAlert?.id) return;
    const alertId = activeSOSAlert.id;

    const unsub = onSnapshot(doc(db, 'alerts', alertId), (snap) => {
      if (!snap.exists()) {
        // Document deleted – clear guardian HUD
        setActiveSOSAlert(prev => {
          if (prev?.id === alertId) {
            addLog('SOS alert removed from database. Guardian HUD cleared.');
            return null;
          }
          return prev;
        });
        return;
      }
      const d = snap.data();
      if (d?.status && d.status !== 'active' && d.status !== 'responding' && d.status !== 'supercell_dispatched' && d.status !== 'rescued_pending_victim_clearance') {
        // Citizen closed the SOS – clear guardian HUD immediately and show success confirmation
        setLastResolvedMember(d.victimName || displayMember?.name || 'Citizen');
        setClosureReason(d.closureReason || 'citizen_standdown');
        setShowSuccessModal(true);
        
        setActiveSOSAlert(prev => {
          if (prev?.id === alertId) {
            addLog(`SOS alert closed by citizen (status: ${d.status}). Guardian HUD cleared.`);
            return null;
          }
          return prev;
        });
      }
    }, (err) => {
      console.warn('Guardian specific-alert watcher error:', err);
    });

    return () => unsub();
  }, [activeSOSAlert?.id]);

  // 2c. Listen to active journeys of linked family members (Safe Rides)
  const [activeJourneys, setActiveJourneys] = useState<Record<string, any>>({});

  useEffect(() => {
    if (familyMembers.length === 0) return;
    const uids = familyMembers.map(m => m.uid || m.id).filter(Boolean);
    if (uids.length === 0) return;

    addLog(`Initiating Safe Ride monitoring for linked family nodes...`);

    const unsubscribes = uids.map(uid => {
      return onSnapshot(doc(db, 'journeys', uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status === 'active' || data.status === 'emergency') {
            setActiveJourneys(prev => {
              if (prev[uid]?.status !== data.status) {
                addLog(`Safe Ride active for family member ${data.userName || 'Citizen'}.`);
              }
              return { ...prev, [uid]: { id: snap.id, ...data } };
            });
          } else {
            setActiveJourneys(prev => {
              if (prev[uid]) {
                addLog(`Safe Ride finished for family member ${prev[uid].userName || 'Citizen'}.`);
              }
              const next = { ...prev };
              delete next[uid];
              return next;
            });
          }
        } else {
          setActiveJourneys(prev => {
            const next = { ...prev };
            delete next[uid];
            return next;
          });
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [familyMembers]);

  // 2d. Listen to completed journeys of linked family members (Past History last 24h)
  useEffect(() => {
    if (familyMembers.length === 0) return;
    const uids = familyMembers.map(m => m.uid || m.id).filter(Boolean);
    if (uids.length === 0) return;

    const qHistory = query(
      collection(db, 'journeys'),
      where('userId', 'in', uids),
      where('status', '==', 'completed')
    );

    const unsubHistory = onSnapshot(qHistory, (snap) => {
      const now = Date.now();
      const last24h = 24 * 60 * 60 * 1000;
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((d: any) => {
          const endedAt = d.endedAt?.toDate?.() || new Date(d.endedAt || 0);
          return (now - endedAt.getTime()) < last24h;
        })
        .sort((a: any, b: any) => {
          const tA = a.endedAt?.toMillis?.() || new Date(a.endedAt || 0).getTime();
          const tB = b.endedAt?.toMillis?.() || new Date(b.endedAt || 0).getTime();
          return tB - tA;
        });
      setHistoricalJourneys(list);
    }, (err) => {
      console.warn("Guardian history listener error:", err);
    });

    return () => unsubHistory();
  }, [familyMembers]);

  // Remote Commands Action Dispatchers
  const handleRemoteRing = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, ringStatus: 'ringing' }));
    addLog(`Requesting phone ring...`);
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: 'ring_phone',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(`Ring command dispatched to device.`);
      setTimeout(() => setHudStats(prev => ({ ...prev, ringStatus: 'success' })), 2000);
      setTimeout(() => setHudStats(prev => ({ ...prev, ringStatus: 'idle' })), 6000);
      toast.success("Phone Ring Command Dispatched!");
    } catch (err: any) {
      addLog(`Ring command failed.`);
      setHudStats(prev => ({ ...prev, ringStatus: 'error' }));
      setTimeout(() => setHudStats(prev => ({ ...prev, ringStatus: 'idle' })), 4000);
      toast.error("Failed to ring device.");
    }
  };

  const handleRemoteSiren = async (victimUid: string) => {
    const isCurrentlySiren = hudStats.sirenStatus === 'active';
    const nextStatus = isCurrentlySiren ? 'idle' : 'active';
    
    setHudStats(prev => ({ ...prev, sirenStatus: isCurrentlySiren ? 'stopping' : 'triggering' }));
    addLog(isCurrentlySiren ? `Requesting siren stop...` : `Requesting remote siren...`);
    
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: isCurrentlySiren ? 'stop_siren' : 'play_siren',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(isCurrentlySiren ? `Siren stop command sent.` : `Siren trigger sent.`);
      toast.success(isCurrentlySiren ? "Siren Stop Command Dispatched!" : "Siren Trigger Dispatched!");
      setTimeout(() => setHudStats(prev => ({ ...prev, sirenStatus: nextStatus })), 2000);
    } catch (err: any) {
      addLog(`Siren request failed.`);
      setHudStats(prev => ({ ...prev, sirenStatus: isCurrentlySiren ? 'active' : 'idle' }));
      toast.error("Failed to dispatch siren command.");
    }
  };

  const handleLocationPing = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, pingCount: prev.pingCount + 1 }));
    addLog(`Requesting current GPS coordinates...`);
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: 'ping_location',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(`Location update request sent.`);
      toast.success("GPS refresh ping sent.");
    } catch (e) {
      addLog(`Location request timed out.`);
      toast.error("Ping request failed.");
    }
  };

  const handleCheckIn = async (victimUid: string) => {
    setHudStats(prev => ({ ...prev, checkInStatus: 'pinging' }));
    addLog(`Sending safety check-in prompt...`);
    try {
      await addDoc(collection(db, 'commands'), {
        targetUid: victimUid,
        command: 'check_in',
        senderUid: user?.uid,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addLog(`Safety check-in sent.`);
      setTimeout(() => setHudStats(prev => ({ ...prev, checkInStatus: 'success' })), 2000);
      toast.success("Safety Check-in request sent.");
    } catch (e) {
      addLog(`Failed to send check-in.`);
      setHudStats(prev => ({ ...prev, checkInStatus: 'error' }));
      toast.error("Failed to send check-in.");
    }
  };

  const handleDeactivateAlert = async (alertId: string) => {
    addLog(`Requesting emergency deactivation...`);
    try {
      // Step 1: Cancel the specific alert
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'cancelled',
        closedAt: serverTimestamp(),
        closureReason: 'resolved_by_guardian'
      });
      
      // Step 2: Ghost cleanup — cancel ALL remaining active alerts for uids
      const uids = familyMembers.map(m => m.uid || m.id).filter(Boolean);
      if (uids.length > 0) {
        const ghostQuery = query(
          collection(db, 'alerts'),
          where('victimUid', 'in', uids)
        );
        const ghostSnap = await getDocs(ghostQuery);
        if (!ghostSnap.empty) {
          const batch = writeBatch(db);
          let count = 0;
          ghostSnap.docs.forEach(ghostDoc => {
            const status = ghostDoc.data().status;
            if (['active', 'responding', 'supercell_dispatched', 'rescued_pending_victim_clearance'].includes(status)) {
              batch.update(ghostDoc.ref, {
                status: 'cancelled',
                closedAt: serverTimestamp(),
                closureReason: 'ghost_cleanup_by_guardian'
              });
              count++;
            }
          });
          if (count > 0) {
            await batch.commit();
            console.log(`🧹 [Guardian] Ghost sweep: resolved ${count} remaining active alert(s).`);
          }
        }
      }

      // Step 3: Supabase sync
      try {
        const { supabase } = await import('../../../lib/supabase');
        await supabase
          .from('alerts')
          .update({
            status: 'cancelled',
            metadata: { resolvedBy: 'guardian', resolvedAt: new Date().toISOString() }
          })
          .eq('id', alertId);
      } catch (sbErr) {
        console.warn('[Guardian] Supabase sync failed (non-fatal):', sbErr);
      }

      setLastResolvedMember(displayMember?.name || 'Citizen');
      setClosureReason('resolved_by_guardian');
      setShowSuccessModal(true);
      setActiveSOSAlert(null);
      addLog(`Emergency alert resolved by Guardian.`);
      toast.success("Emergency Alert resolved and marked safe.");
    } catch (err: any) {
      addLog(`Deactivation failed.`);
      console.error("Failed to deactivate alert:", err);
      toast.error(err.message || "Failed to resolve alert.");
    }
  };

  const handleForceGhostClear = async () => {
    addLog(`Initiating manual ghost sweep...`);
    try {
      const uids = familyMembers.map(m => m.uid || m.id).filter(Boolean);
      if (uids.length === 0) return;

      const q = query(
        collection(db, 'alerts'),
        where('victimUid', 'in', uids)
      );

      const snap = await getDocs(q);
      let totalCleared = 0;
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(ghostDoc => {
          const status = ghostDoc.data().status;
          if (['active', 'responding', 'supercell_dispatched', 'rescued_pending_victim_clearance'].includes(status)) {
            batch.update(ghostDoc.ref, {
              status: 'cancelled',
              closedAt: serverTimestamp(),
              closureReason: 'guardian_ghost_sweep'
            });
            totalCleared++;
          }
        });
        if (totalCleared > 0) {
          await batch.commit();
        }
      }
      setLastResolvedMember(displayMember?.name || 'Citizen');
      setClosureReason('guardian_ghost_sweep');
      setShowSuccessModal(true);
      setActiveSOSAlert(null);
      addLog(`Ghost sweep complete. Cleared ${totalCleared} stale alert(s).`);
      toast.success(`Cleared ${totalCleared} stale alert(s). Guardian HUD reset.`);
    } catch (err) {
      console.error('[Guardian] Ghost sweep error:', err);
      toast.error('Ghost sweep failed. Check console.');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const [nearbyProtectors, setNearbyProtectors] = useState<any[]>([]);
  const [loadingProtectors, setLoadingProtectors] = useState(false);

  useEffect(() => {
    setLoadingProtectors(true);
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'protector')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const familyUids = new Set(familyMembers.map(m => m.id || m.uid).filter(Boolean));
      const pList: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id === user?.uid || familyUids.has(doc.id)) return;
        pList.push({ id: doc.id, ...data });
      });

      // Calculate distance relative only to the relative's (victim/citizen) coordinates
      const sosLat = activeSOSAlert?.latitude || activeSOSAlert?.location?.lat || activeSOSAlert?.coords?.[0];
      const sosLng = activeSOSAlert?.longitude || activeSOSAlert?.location?.lng || activeSOSAlert?.coords?.[1];
      const citizenMember = displayMember;
      const citizenLat = citizenMember?.lastLocation?.lat || citizenMember?.lastLocation?.latitude || citizenMember?.locationData?.lat || citizenMember?.latitude;
      const citizenLng = citizenMember?.lastLocation?.lng || citizenMember?.lastLocation?.longitude || citizenMember?.locationData?.lng || citizenMember?.longitude;

      const lat1 = sosLat || citizenLat || 26.9124;
      const lon1 = sosLng || citizenLng || 75.7873;

      const computed = pList.map((p) => {
        const pLat = p.telemetry?.coords?.[0] || p.lastLocation?.lat || p.lastLocation?.latitude || p.latitude;
        const pLng = p.telemetry?.coords?.[1] || p.lastLocation?.lng || p.lastLocation?.longitude || p.longitude;
        let distance = 999;
        if (pLat && pLng) {
          distance = calculateDistance(lat1, lon1, pLat, pLng);
        }
        return {
          ...p,
          distance,
          distanceStr: distance === 999 ? 'Location unavailable' : distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)} km away`
        };
      });

      // Only include protectors with a valid calculated distance (exclude 999)
      const validComputed = computed.filter(p => p.distance !== 999);
      
      // Show on-duty protectors first; if none, show all valid ones
      const onDuty = validComputed.filter(p => p.isOnDuty === true);
      const sorted = (onDuty.length > 0 ? onDuty : validComputed).sort((a, b) => a.distance - b.distance);

      setNearbyProtectors(sorted);
      setLoadingProtectors(false);
    }, (err) => {
      console.error("Failed to fetch protectors:", err);
      setLoadingProtectors(false);
    });

    return () => unsubscribe();
  }, [activeSOSAlert, user, displayMember, familyMembers]);

  const handleAssignProtector = async (protector: any) => {
    if (!activeSOSAlert?.id) {
      toast.error("No active SOS alert to assign protector to.");
      return;
    }

    try {
      const alertRef = doc(db, 'alerts', activeSOSAlert.id);
      const alertSnap = await getDoc(alertRef);
      if (!alertSnap.exists()) {
        toast.error("Alert not found.");
        return;
      }

      const alertData = alertSnap.data();
      const respondersMap = alertData.responders || {};
      
      if (respondersMap[protector.id]) {
        toast.info(`${protector.name || 'Protector'} is already responding to this SOS.`);
        return;
      }

      const activeRespondersCount = Object.keys(respondersMap).length;
      let assignedRole = 'standby';
      if (activeRespondersCount === 0) assignedRole = 'primary';
      else if (activeRespondersCount === 1) assignedRole = 'backup';

      const now = Date.now();
      const responderData = {
        uid: protector.id,
        name: protector.name || 'Protector Saathi',
        photoRef: protector.photoUrl || protector.photoURL || '',
        role: assignedRole,
        joinedAt: now,
        acceptedAt: now,
        freezeLockExpiresAt: now + 30000,
        trustTier: protector.trustTier || 'blue',
        completedMissions: protector.completedMissions || 0,
      };

      const updatedResponders = {
        ...respondersMap,
        [protector.id]: responderData
      };

      await updateDoc(alertRef, {
        responders: updatedResponders,
        status: alertData.status === 'active' ? 'responding' : alertData.status
      });

      try {
        const { supabase } = await import('../../../lib/supabase');
        await supabase
          .from('alerts')
          .update({
            status: alertData.status === 'active' ? 'responding' : alertData.status,
            metadata: {
              ...(alertData.metadata || {}),
              responders: updatedResponders
            }
          })
          .eq('id', activeSOSAlert.id);
      } catch (sbErr) {
        console.error("Supabase sync error:", sbErr);
      }

      addLog(`Assigned protector ${protector.name || 'Responder'} to dispatch location.`);
      toast.success(`${protector.name || 'Responder'} has been assigned.`);
    } catch (err: any) {
      console.error("Failed to assign protector:", err);
      toast.error(err.message || "Failed to assign protector.");
    }
  };

  const handleDeleteHistory = async (journeyId: string) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'journeys', journeyId));
      toast.success("History record deleted successfully.");
    } catch (err: any) {
      console.error("Failed to delete history record:", err);
      toast.error("Failed to delete history.");
    }
  };

  const handleTriggerSMSBridge = async (member: any, lat: number, lng: number) => {
    try {
      const alertData = {
        victimUid: member.id || member.uid,
        victimName: member.name || 'Citizen',
        victimPhone: member.phoneNumber || '',
        latitude: lat,
        longitude: lng,
        status: 'active',
        triggerMethod: 'sms_bridge',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'alerts'), alertData);
      addLog(`Manual SMS SOS alert bridged for ${member.name} at coordinates [${lat}, ${lng}].`);
      toast.success("SOS Alert Bridged successfully!", {
        description: `All nearby protectors have been alerted to the coordinates.`
      });
      return docRef.id;
    } catch (err: any) {
      console.error("SMS Bridge failed:", err);
      toast.error("Failed to bridge SMS SOS: " + err.message);
      throw err;
    }
  };

  const isSOSActiveState = activeSOSAlert !== null;

  return {
    userPos,
    user,
    profile,
    activeTab,
    setActiveTab,
    familyMembers,
    loadingFamily,
    activeSOSAlert,
    setActiveSOSAlert,
    hudStats,
    setHudStats,
    resolvedAddresses,
    showSuccessModal,
    setShowSuccessModal,
    lastResolvedMember,
    setLastResolvedMember,
    closureReason,
    setClosureReason,
    isMapFullScreen,
    setIsMapFullScreen,
    systemLogs,
    addLog,
    nearbyProtectors,
    loadingProtectors,
    displayMember,
    isSOSActiveState,
    handleRemoteRing,
    handleRemoteSiren,
    handleLocationPing,
    handleCheckIn,
    handleDeactivateAlert,
    handleForceGhostClear,
    handleAssignProtector,
    activeJourney: displayMember ? (activeJourneys[displayMember.id || displayMember.uid] || null) : null,
    historicalJourneys,
    handleDeleteHistory,
    handleTriggerSMSBridge
  };
}


